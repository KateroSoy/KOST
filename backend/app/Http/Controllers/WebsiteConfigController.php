<?php
namespace App\Http\Controllers;
use App\Models\WebsiteConfig;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WebsiteConfigController extends Controller {
    public function index(Request $request) {
        $data = WebsiteConfig::where('user_id', $request->user()->id)->get();
        return response()->json($data->map(function($i) {
            return [
                'propertyId' => $i->property_id,
                'templateId' => $i->template_id,
                'subdomain' => $i->subdomain,
                'customDomain' => $i->custom_domain,
                'headline' => $i->headline,
                'subheadline' => $i->subheadline,
                'aboutText' => $i->about_text,
                'accentColor' => $i->accent_color,
                'showAvailabilityWidget' => (bool) $i->show_availability_widget,
                'showReviews' => (bool) $i->show_reviews,
                'showFaq' => (bool) $i->show_faq,
                'whatsappDirect' => $i->whatsapp_direct,
                'sections' => $i->sections ?? [],
                'isPublished' => (bool) $i->is_published,
            ];
        }));
    }
    public function store(Request $request) {
        $data = $request->validate([
            'propertyId' => 'required|string',
            'templateId' => 'required|string',
            'subdomain' => 'required|string',
            'customDomain' => 'nullable|string',
            'headline' => 'required|string',
            'subheadline' => 'required|string',
            'aboutText' => 'required|string',
            'accentColor' => 'required|string',
            'showAvailabilityWidget' => 'sometimes|boolean',
            'showReviews' => 'sometimes|boolean',
            'showFaq' => 'sometimes|boolean',
            'whatsappDirect' => 'required|string',
            'sections' => 'sometimes|array',
            'isPublished' => 'sometimes|boolean',
        ]);
        $userId = $request->user()->id;
        // Rows other than the one being upserted — subdomain/custom_domain are globally unique.
        $others = fn () => WebsiteConfig::where(fn ($q) => $q->where('user_id', '!=', $userId)->orWhere('property_id', '!=', $data['propertyId']));

        if (!empty($data['customDomain']) && $others()->where('custom_domain', $data['customDomain'])->exists()) {
            throw ValidationException::withMessages(['customDomain' => 'Domain ini sudah dipakai properti lain.']);
        }

        $base = $data['subdomain'];
        $subdomain = $base;
        for ($n = 1; $others()->where('subdomain', $subdomain)->exists(); $n++) {
            $subdomain = $base . '-' . $n;
        }

        WebsiteConfig::updateOrCreate(
            ['user_id' => $userId, 'property_id' => $data['propertyId']],
            [
                'template_id' => $data['templateId'],
                'subdomain' => $subdomain,
                'custom_domain' => $data['customDomain'] ?? null,
                'headline' => $data['headline'],
                'subheadline' => $data['subheadline'],
                'about_text' => $data['aboutText'],
                'accent_color' => $data['accentColor'],
                'show_availability_widget' => $data['showAvailabilityWidget'] ?? true,
                'show_reviews' => $data['showReviews'] ?? true,
                'show_faq' => $data['showFaq'] ?? true,
                'whatsapp_direct' => $data['whatsappDirect'],
                'sections' => $data['sections'] ?? [],
                'is_published' => $data['isPublished'] ?? true,
            ]
        );
        return response()->json(['success' => true, 'subdomain' => $subdomain]);
    }
    public function destroy(Request $request, $propertyId) {
        WebsiteConfig::where('user_id', $request->user()->id)->where('property_id', $propertyId)->delete();
        return response()->json(['ok' => true]);
    }
}
