<?php

namespace App\Repository;

use App\Entity\Place;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Place|null find($id, $lockMode = null, $lockVersion = null)
 * @method Place|null findOneBy(array $criteria, array $orderBy = null)
 * @method Place[]    findAll()
 * @method Place[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PlaceRepository extends ServiceEntityRepository
{
    private $supportedTypes;
    private $em;

    public function __construct(array $supportedTypes, ManagerRegistry $registry, EntityManagerInterface $em)
    {
        parent::__construct($registry, Place::class);

        $this->supportedTypes = $supportedTypes;
        $this->em = $em;
    }

    public function truncate(): void
    {
        $connection = $this->em->getConnection();
        $dbPlatform = $connection->getDatabasePlatform();
        $q = $dbPlatform->getTruncateTableSql('place');

        $connection->executeStatement($q);
    }

    public function persist(Place $place): void
    {
        $this->em->persist($place);
    }

    public function flush(): void
    {
        $this->em->flush();
    }

    public function findByLocationAndType(float $neLon, float $neLat, float $swLon, float $swLat): PlaceCollection
    {
        //                        Top right      Bottom right   Bottom left    Top left       Back to top right
        $boundingBox = "POLYGON (($neLon $neLat, $swLon $neLat, $swLon $swLat, $neLon $swLat, $neLon $neLat))";

        $qb = $this->createQueryBuilder('p');

        $result = $qb->Where($qb->expr()->in('p.type', ':types'))
            ->andWhere('ST_Within(p.point, ST_GeometryFromText(:boundingBox, 4326)) = true')
            ->orderBy('p.type', 'ASC')
            ->setParameter('types', array_column($this->supportedTypes, 'type'))
            ->setParameter('boundingBox', $boundingBox)
            ->getQuery()
            ->execute();

        return new PlaceCollection($this->supportedTypes, $result);
    }
}
