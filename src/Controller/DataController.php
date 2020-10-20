<?php

namespace App\Controller;

use App\Repository\PlaceRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class DataController extends AbstractController
{
    private $supportedTypes;
    private $placeRepository;

    public function __construct(array $supportedTypes, PlaceRepository $placeRepository)
    {
        $this->supportedTypes = $supportedTypes;
        $this->placeRepository = $placeRepository;
    }

    /**
     * @Route("/api/data/types", name="types", methods={"GET"})
     */
    public function getTypes(): JsonResponse
    {
        return $this->json($this->supportedTypes);
    }

    /**
     * @Route("/api/data/{neLon}/{neLat}/{swLon}/{swLat}", name="data", methods={"GET"})
     */
    public function getData(float $neLon, float $neLat, float $swLon, float $swLat): JsonResponse
    {
        $points = $this->placeRepository->findByLocationAndType($neLon, $neLat, $swLon, $swLat)->getGeoJSON();

        return $this->json($points);
    }
}
