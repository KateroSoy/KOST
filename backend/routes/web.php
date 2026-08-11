<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    return file_get_contents(__DIR__ . '/../index.html');
})->where('any', '^(?!api).*$');
