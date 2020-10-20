<?php

namespace App\Repository;

class PlaceCollection
{
    private $places;
    private $supportedTypesMap;

    public function __construct(array $supportedTypes, array $places)
    {
        $this->places = $places;
        $this->supportedTypesMap = array_column($supportedTypes, 'icon', 'type');
    }

    /**
     * @return array[
     *  'type' => string,
     *  'geometry' => array[string],
     *  'properties' => array[string]
     * ]
     */
    public function getGeoJSON(): array
    {
        $features = [];

        foreach ($this->places as $item) {
            $features[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$item->getPoint()->getX(), $item->getPoint()->getY()],
                ],
                'properties' => [
                    'name' => $item->getType(),
                    'icon' => $this->supportedTypesMap[$item->getType()],
                    'tags' => $item->getTagsSortedAlphabetically(),
                ],
            ];
        }

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }
}
