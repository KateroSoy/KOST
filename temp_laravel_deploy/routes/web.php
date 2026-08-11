<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return file_get_contents($indexPath);
    }
    return response()->json(['name' => 'StayFlow API Server', 'status' => 'online']);
})->where('any', '^(?!api).*$');

