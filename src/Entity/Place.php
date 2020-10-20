<?php

namespace App\Entity;

use App\Repository\PlaceRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Index;
use Doctrine\ORM\Mapping\Table;
use GeoIO\Dimension;
use GeoIO\Geometry\Coordinates;
use GeoIO\Geometry\Point;
use SimpleXMLElement;

/**
 * @ORM\Entity(repositoryClass=PlaceRepository::class)
 *
 * @Entity
 * @Table(
 *     indexes={
 *         @Index(name="idx_point", columns={"point"}, flags={"spatial"}),
 *     }
 * )
 */
class Place
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue
     */
    private $id;

    /**
     * @ORM\Column(type="geometry", name="point", options={"geometry_type"="POINT", "srid"=4326})
     */
    private $point;

    /**
     * @ORM\Column(type="text")
     */
    private $type;

    /**
     * @ORM\Column(type="hstore")
     */
    private $tags;

    public function __construct(Point $point, string $type, array $tags = [])
    {
        $this->point = $point;
        $this->type = $type;
        $this->tags = $tags;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getPoint(): Point
    {
        return $this->point;
    }

    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @return array[string]
     */
    public function getTags(): array
    {
        return $this->tags;
    }

    /**
     * @return array[string]
     */
    public function getTagsSortedAlphabetically(): array
    {
        if (count($this->tags) > 1) {
            ksort($this->tags, SORT_NATURAL);
        }

        return $this->tags;
    }

    public static function createFromXml(SimpleXMLElement $xml): Place
    {
        $amenity = null;
        $tags = [];

        foreach ($xml->children()->{'tag'} as $tag) {
            $key = (string) $tag['k'];

            if ('building' !== $key && 'addr:country' !== $key) {
                $value = (string) $tag['v'];

                if ('amenity' === $key) {
                    $amenity = $value;
                } else {
                    $tags[$key] = $value;
                }
            }
        }

        if (null === $amenity) {
            throw new \InvalidArgumentException(sprintf('Could not determine amenity type of id: %d', $xml->attributes()->{'id'}));
        }

        $coords = new Coordinates((float) $xml->attributes()->{'lon'}, (float) $xml->attributes()->{'lat'});
        $point = new Point(Dimension::DIMENSION_2D, $coords, 4326);

        return new Place($point, $amenity, $tags);
    }
}
