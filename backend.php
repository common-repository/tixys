<?php

class TixysBackend
{
    private $settings;

    private $api_base = 'https://%1$s/api/shop.v1/%2$s?request=%3$s&locale=%4$s';

    private $cache_ttl = 600;

    public function __construct(stdClass $settings)
    {
        $this->settings = $settings;
    }

    public function get_result($type, $id = null)
    {
        $result = $this->cache_get($type, $id);

        if (!is_array($result))
        {
            $result = $this->retrieve_result($type === 'start' ? 'Station.searchDestinations' : 'Station.searchDepartures', $id);
            $this->cache_put($type, $id, $result);
        }

        return $result;
    }

    private function cache_get($type, $id)
    {
        $value = get_transient($this->cache_create_key($type, $id));
        return is_array($value) ? $value : null;
    }

    private function cache_put($type, $id, $result)
    {
        $value = set_transient($this->cache_create_key($type, $id), $result, $this->cache_ttl);
    }

    private function cache_create_key($type, $id)
    {
        $key = ($type === 'start') ? 'start' : "$type-$id";
        return sprintf('%s-%s', $key, $this->settings->site);
    }

    private function retrieve_result($endpoint, $stationId)
    {
        try
        {
            $requestObject = (object)array(
                'Site' => $this->settings->site,
                'Station' => $stationId
            );

            $request = sprintf(
                $this->api_base,
                $this->settings->domain ?: 'shop.tixys.com',
                $endpoint,
                urlencode(json_encode($requestObject)),
                get_locale()
            );

            $response = wp_remote_get($request);
            $response = json_decode($response['body']);

            if (!$response || !is_object($response) || !isset($response->success) || $response->success !== true)
                throw new \Exception("Failed loading data.");

            $payload = $this->transform_api_result($response->payload, $response->entityList);
            $list = $this->filter_station_list($payload->itemList);
        }
        catch(\Exception $e)
        {
            $list = array();
        }

        return $list;
    }

    private function transform_api_result($value, $entityList)
    {
        if (is_object($value))
        {
            $new_value = new stdClass();

            foreach ((array)$value as $k=>$v)
                $new_value->$k = $this->transform_api_result($v, $entityList);
        }
        elseif (is_array($value))
        {
            $new_value = array();

            foreach ($value as $k=>$v)
                $new_value[$k] = $this->transform_api_result($v, $entityList);
        }
        else if (is_string($value) && preg_match("|#e#:[0-9]+|i", $value))
        {
            $new_value = $this->transform_api_result($entityList->$value, $entityList);
        }
        else
        {
            $new_value = $value;
        }

        return $new_value;
    }

    private function filter_station_list($list)
    {
        $newList = array();
        $locale = get_locale();

        foreach ($list as $station)
            $newList[$station->id] = $this->out($station->name, $locale);

        if (class_exists('Collator'))
        {
            $Collator = new \Collator($locale);
            $Collator->asort($newList);
        }

        return $newList;
    }

    private function out($string, $locale)
    {
        $lang = substr($locale, 0, 2);
        $obj = self::multilangStringToObject($string);

        if (isset($obj->$lang))
            $newString = $obj->$lang;
        elseif (isset($obj->en))
            $newString = $obj->en;
        else
            $newString = $string;

        return esc_html($newString);
    }





    private function multilangStringToObject($string)
    {
        $obj = new stdClass;

        if (strpos($string, '[:') !== false && preg_match('|^\[:[a-z]{2}\]|', $string))
        {
            $stringarray = preg_split('|\[:([a-z]{2})\]|', $string, -1, PREG_SPLIT_DELIM_CAPTURE);

            // throw away (empty) first element and renumber
            array_shift($stringarray);
            $stringarray = array_values($stringarray);

            if (is_array($stringarray) && count($stringarray) >= 2)
            {
                foreach ($stringarray as $k=>$v)
                {
                    if (!($k%2) && $v && isset($stringarray[$k+1]))
                    {
                        $obj->$v = $stringarray[$k+1];
                    }
                }
            }
        }

        return $obj;
    }
}
