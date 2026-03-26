<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\BusinessSettingsUpdateRequest;
use App\Support\BusinessSettings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessSettingsController extends Controller
{
    public function edit(BusinessSettings $businessSettings): Response
    {
        return Inertia::render('settings/business', [
            'settings' => $businessSettings->all(),
            'invoicePreview' => $businessSettings->invoicePreview(),
        ]);
    }

    public function update(
        BusinessSettingsUpdateRequest $request,
        BusinessSettings $businessSettings,
    ): RedirectResponse {
        $businessSettings->put($request->validated());

        return to_route('business-settings.edit')->with('flash', [
            'type' => 'success',
            'message' => 'Business settings updated successfully.',
        ]);
    }
}
