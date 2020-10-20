<?php

namespace App\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use GeoIO\Geometry\Extractor;
use GeoIO\Geometry\Factory;
use GeoIO\WKT\Generator\Generator;
use GeoIO\WKT\Parser\Parser;
use Jsor\Doctrine\PostGIS\Types\GeometryType as BaseGeometryType;

// @TODO Add return types and phpdoc
class GeometryType extends BaseGeometryType
{
    private static $parser;
    private static $generator;

    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {
        return self::getGenerator()->generate($value);
    }

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        return self::getParser()->parse($value);
    }

    private static function getParser()
    {
        if (!self::$parser) {
            self::$parser = new Parser(new Factory());
        }

        return self::$parser;
    }

    private static function getGenerator()
    {
        if (!self::$generator) {
            self::$generator = new Generator(
                new Extractor(),
                [
                    'format' => Generator::FORMAT_EWKT,
                    'emit_srid' => true,
                ]
            );
        }

        return self::$generator;
    }
}
