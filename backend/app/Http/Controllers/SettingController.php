<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::find(1);

        return response()->json($settings->data ?? []);
    }

    public function update(Request $request)
    {
        Setting::updateOrCreate(['id' => 1], ['data' => $request->all()]);

        return response()->json($request->all());
    }
}
