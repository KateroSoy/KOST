<?php
namespace App\Http\Controllers;
use App\Models\WebsiteConfig;
use Illuminate\Http\Request;

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
        $data = $request->all();
        WebsiteConfig::updateOrCreate(
            ['user_id' => $request->user()->id, 'property_id' => $data['propertyId']],
            [
                'template_id' => $data['templateId'],
                'subdomain' => $data['subdomain'],
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
        return response()->json(['success' => true]);
    }
    public function destroy(Request $request, $propertyId) {
        WebsiteConfig::where('user_id', $request->user()->id)->where('property_id', $propertyId)->delete();
        return response()->json(['ok' => true]);
    }
}
