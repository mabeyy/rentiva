<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Trusted Proxies
    |--------------------------------------------------------------------------
    |
    | Hosting runs the app behind a load balancer: trust it for the real
    | visitor IP (rate limits) and https (signed booking links). Set a
    | comma-separated list of addresses to trust only those.
    |
    */

    'proxies' => env('TRUSTED_PROXIES', '*'),

];
