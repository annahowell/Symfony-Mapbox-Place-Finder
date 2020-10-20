<?php

namespace App\Command;

use App\Entity\Place;
use App\Repository\PlaceRepository;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class ImportOsmCommand extends Command
{
    protected static $defaultName = 'app:import:osm';

    private const OSM_URL = 'https://download.geofabrik.de/europe/great-britain-latest.osm.pbf';
    private $supportedTypes;
    private $placeRepo;
    private $io;

    protected function configure()
    {
        $this->setDescription('Import OSM data');
    }

    public function __construct(array $supportedTypes, PlaceRepository $placeRepo)
    {
        parent::__construct();

        $this->supportedTypes = array_column($supportedTypes, 'type');
        $this->placeRepo = $placeRepo;
    }

    /**
     * Downloads the source osm data in pbf format if it does not already exist on disk, then calls convertFile().
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->io = new SymfonyStyle($input, $output);
        $client = new Client();

        $pathFileName = getcwd().'/var/great-britain-latest';
        $pathFileNameExt = $pathFileName.'.osm.pbf';

        if (false === file_exists($pathFileNameExt)) {
            $this->io->title('Downloading: to '.$pathFileNameExt);

            try {
                $progress = null;

                $client->get(self::OSM_URL, [
                    'sink' => $pathFileNameExt,
                    'progress' => function ($downloadTotal, $downloadedBytes) use (&$progress) {
                        if ($downloadTotal > 0 && is_null($progress)) {
                            $progress = $this->io->createProgressBar($downloadTotal);
                            $progress->start();
                        }

                        if (false === is_null($progress)) {
                            if ($downloadTotal === $downloadedBytes) {
                                $progress->finish();

                                return;
                            }
                            $progress->setProgress($downloadedBytes);
                        }
                    },
                ]);
            } catch (GuzzleException $e) {
                $this->io->newLine(2);
                $this->io->error('An error occurred: '.$e->getMessage());

                return Command::FAILURE;
            }
            $this->io->newLine(2);
            $this->io->success('Successfully downloaded file to: '.$pathFileNameExt);
        } else {
            $this->io->title('Skipping download and reusing: '.$pathFileNameExt);
        }

        $convertAndFilterSuccess = $this->convertFile($pathFileName);

        return $convertAndFilterSuccess ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Converts the source pbf to o5m if it does not already exist on disk, so that it may then be filtered by
     * filterFileToXml().
     */
    private function convertFile(string $pathFileName): bool
    {
        $pathFileNameExt = $pathFileName.'.o5m';

        if (false === file_exists($pathFileNameExt)) {
            $convertArray = [
                'osmconvert',
                $pathFileName.'.osm.pbf',
                '--all-to-nodes',
                '--max-objects=99999999999',
                '--out-o5m',
                '-o='.$pathFileNameExt,
            ];

            $this->io->newLine(2);
            $this->io->title("Attempting to convert .pbf to .o5m with:\n".implode(' ', $convertArray));

            $process = new Process($convertArray);
            $process->setTimeout(900);

            try {
                $process->mustRun();
                $process->wait();

                if (false === file_exists($pathFileNameExt)) {
                    $this->io->error('Something went wrong and '.$pathFileName.'.osm.pbf could not be converted and/or written to '.$pathFileNameExt);

                    return false;
                }

                $this->io->success('File successfully converted to: '.$pathFileNameExt);
            } catch (ProcessFailedException $exception) {
                $this->io->error(new ProcessFailedException($process));

                return false;
            }
        } else {
            $this->io->newLine(2);
            $this->io->title('Skipping conversion of .osm.pbf to .o5m and reusing '.$pathFileNameExt);
        }

        return $this->filterFileToXml($pathFileName);
    }

    /**
     * Filters the source o5m to xml if it does not already exist on disk, so that it may then be processed by
     * processFileAndSaveToDatabase().
     */
    private function filterFileToXml(string $pathFileName): bool
    {
        $pathFileNameExt = $pathFileName.'.xml';

        if (false === file_exists($pathFileNameExt)) {
            $amenityTypesToKeepString = '--keep=amenity';

            foreach ($this->supportedTypes as $type) {
                $amenityTypesToKeepString .= '='.(string) $type.' ';
            }

            $filterArray = [
                'osmfilter',
                $pathFileName.'.o5m',
                $amenityTypesToKeepString,
                '--drop-tags=fhrs:*= created_by= wikidata= royal_cypher= post_box:design= post_box:type= box_type= fixme= ref:*= brand:*= layer= seamark:building:function= building:*= source:*= wikipedia= source= roof:*=',
                '--out-osm',
                '-o='.$pathFileNameExt,
            ];

            $this->io->newLine(2);
            $this->io->title("Attempting to filter .o5m to .xml with:\n".implode(' ', $filterArray));

            $process = new Process($filterArray);
            $process->setTimeout(900);

            try {
                $process->mustRun();
                $process->wait();

                if (false === file_exists($pathFileNameExt)) {
                    $this->io->error(
                        'Something went wrong and ',
                        $pathFileName.'.o5m could not be filtered ',
                        'and/or written to '.$pathFileNameExt
                    );

                    return false;
                }

                $this->io->success('File successfully filtered to: '.$pathFileNameExt);
            } catch (ProcessFailedException $exception) {
                $this->io->error(new ProcessFailedException($process));

                return false;
            }
        } else {
            $this->io->newLine(2);
            $this->io->title('Skipping filtering of .o5m to .xml and reusing '.$pathFileNameExt);
        }

        return $this->processFileAndSaveToDatabase($pathFileName);
    }

    /**
     * Processes the already filtered xml and saves relevant data to the database.
     */
    private function processFileAndSaveToDatabase(string $pathFileName): bool
    {
        $this->io->newLine(2);
        $this->io->title('Attempting to process and import '.$pathFileName.'.xml to the database');

        $xml = simplexml_load_file(
            $pathFileName.'.xml',
            null,
            LIBXML_BIGLINES | LIBXML_PARSEHUGE | LIBXML_NOBLANKS | LIBXML_COMPACT | LIBXML_NOCDATA
        );

        if (false === $xml) {
            $this->io->error('Something went wrong and '.$pathFileName.'.xml could not processed');

            return false;
        }

        try {
            $processed = 0;
            $batchSize = 2000;
            $amenity = null;
            $place = null;

            $this->placeRepo->truncate();

            $progress = $this->io->createProgressBar($xml->count() - 1); // -1 for unused <bounds/>);
            $progress->start();
            $progress->setRedrawFrequency(100);
            $progress->minSecondsBetweenRedraws(0.1);

            foreach ($xml->{'node'} as $node) {
                ++$processed;
                try {
                    $place = Place::createFromXMl($node);
                } catch (\InvalidArgumentException $e) {
                    // Commenting this as to not alarm users
                    // $this->io->warning($e->getMessage());

                    continue;
                }

                $this->placeRepo->persist($place);

                $progress->advance();

                if (0 === $processed % $batchSize) {
                    $this->placeRepo->flush();
                }
            }

            $progress->finish();

            $this->placeRepo->flush();

            $this->io->newLine(2);
            $this->io->success('Successfully imported '.($xml->count() - 1).' places in to the database');

            return true;
        } catch (\Exception $e) {
            $this->io->newLine(2);
            $this->io->error($e->getMessage());

            return false;
        }
    }
}
