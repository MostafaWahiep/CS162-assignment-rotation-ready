// Page for displaying detailed information about a single item.
// Fetches item data from the backend and focuses on read-only presentation,
// including loading/error states and UI-only interactions (e.g. share link).

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById } from '@/api/item';
import { verifyItem, getItemVerifications } from '@/api/verification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { MapPin, Clock, User, CheckCircle, Tag, ArrowLeft, Share2, Bookmark, Navigation } from 'lucide-react';
import { colorSchemes, defaultScheme } from '@/lib/themes.js';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [verifying, setVerifying] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const scheme = item && item.rotation_city ? colorSchemes[item.rotation_city.name] || defaultScheme : defaultScheme;
  
  const handleDirections = () => {
    if (item?.rotation_city?.res_hall_location && item?.location) {
      const origin = encodeURIComponent(item.rotation_city.res_hall_location);
      const destination = encodeURIComponent(item.location);
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
      window.open(url, '_blank');
    }
  };
  
  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitialsFromName = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || "?";
  };

  const loadVerifications = async () => {
    try {
      const v = await getItemVerifications(id);
      setVerifications(v?.verifications || []);
    } catch {
      // Don't break the page if verifications fails
      setVerifications([]);
    }
  };

  const handleGoToUserProfile = () => {
    const userId = item?.added_by_user?.user_id;
    if (!userId) return;
    navigate(`/user/${userId}`);
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getItemById(id);
        setItem(data);

        // fetch verifications after item loads
        await loadVerifications();
      } catch (err) {
        setError(err.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      await verifyItem(id);

      // optimistic count update (so UI updates immediately)
      setItem((prev) => ({
        ...prev,
        number_of_verifications: (prev?.number_of_verifications || 0) + 1,
      }));

      await loadVerifications();
    } catch (e) {
      alert("You already verified today (or an error occurred).");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription className="text-slate-300">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Item not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstInitial = item.added_by_user?.first_name?.[0] || '';
  const lastInitial = item.added_by_user?.last_name?.[0] || '';
  const profilePic = item.added_by_user?.profile_picture || null;

  return (
    <div className={`min-h-screen ${scheme.bg}`}>
      {/* Hero Section */}
      <div className={`relative ${scheme.heroBg} overflow-hidden`}>
        <div className={`absolute inset-0 ${scheme.overlay}`}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-6 text-white hover:bg-white/20 transition-all border border-white/25 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <button
                type="button"
                onClick={handleGoToUserProfile}
                className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4 hover:bg-white/30 transition"
              >
                <span className="text-white text-sm font-medium">
                  Recommended by {item.added_by_user?.first_name || 'a fellow student'}
                </span>
              </button>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {item.name}
              </h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{item.location}</span>
                </div>
                {item.walking_distance && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">{Math.round(item.walking_distance / 80)} min walk</span>
                  </div>
                )}
              </div>

              {item.categories && item.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.categories.map((category) => (
                    <span
                      key={category.category_id}
                      className="px-4 py-2 bg-white/90 text-gray-900 rounded-lg text-sm font-semibold shadow-lg"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick Stats Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl min-w-[280px]">
              <div className="flex items-center justify-center gap-2 pb-4 border-b border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-gray-900">
                  {item.number_of_verifications || 0} {(item.number_of_verifications || 0) === 1 ? 'Verification' : 'Verifications'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">City</span>
                  <span className="font-semibold text-gray-900">{item.rotation_city?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Added</span>
                  <span className="font-semibold text-gray-900">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {item.rotation_city?.res_hall_location && (
                  <Button
                    className={`w-full ${scheme.heroBg} text-white hover:opacity-90 shadow-lg`}
                    onClick={handleDirections}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Share"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About This Place */}
            {item.rotation_city && (
              <Card className={`${scheme.cardBg} ${scheme.border} backdrop-blur-sm`}>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    About This Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${scheme.innerBg} rounded-lg p-4`}>
                      <div className="text-sm text-gray-600 mb-1">Time Zone</div>
                      <div className="text-lg text-gray-900 font-medium">{item.rotation_city.time_zone}</div>
                    </div>
                    {item.rotation_city.res_hall_location && (
                      <div className={`${scheme.innerBg} rounded-lg p-4`}>
                        <div className="text-sm text-gray-600 mb-1">Near</div>
                        <div className="text-lg text-gray-900 font-medium">{item.rotation_city.res_hall_location}</div>
                      </div>
                    )}
                    {item.walking_distance && (
                      <div className={`${scheme.innerBg} rounded-lg p-4`}>
                        <div className="text-sm text-gray-600 mb-1">Distance</div>
                        <div className="text-lg text-gray-900 font-medium">{item.walking_distance}m away</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details & Attributes */}
            {item.tags && item.tags.length > 0 && (
              <Card className={`${scheme.cardBg} ${scheme.border} backdrop-blur-sm`}>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                    <Tag className="w-6 h-6" />
                    What to Know
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Key details about this recommendation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.tags.map((tag) => (
                      <div
                        key={tag.tag_id}
                        className={`${scheme.innerBg} rounded-lg p-4 flex items-center justify-between border border-gray-200 hover:border-gray-300 transition-colors`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">{tag.name}</div>
                        </div>
                        <div className="ml-4">
                          {tag.value_type === 'boolean' ? (
                            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                              tag.value
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {tag.value ? '✓ Yes' : '✗ No'}
                            </span>
                          ) : (
                            <span className="text-gray-900 font-semibold text-lg">{tag.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommender Card */}
            {item.added_by_user && (
              <Card className={`${scheme.cardBg} ${scheme.border} backdrop-blur-sm`}>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Recommended by
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <button
                    type="button"
                    onClick={handleGoToUserProfile}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {profilePic ? (
                          <img
                            src={profilePic}
                            alt={`${item.added_by_user.first_name} ${item.added_by_user.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-900 font-bold text-lg">
                            {firstInitial}{lastInitial}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg hover:underline">
                          {item.added_by_user.first_name} {item.added_by_user.last_name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.added_by_user.email}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Fellow Minerva student sharing local insights
                        </div>
                      </div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}

            {/* ✅ NEW: Verified By Card (added; does not remove anything) */}
            <Card className={`${scheme.cardBg} ${scheme.border} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verified by
                </CardTitle>
                <CardDescription className="text-gray-600">
                  People who verified this place
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {verifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No verifications yet.</p>
                ) : (
                  verifications.map((v) => (
                    <div key={v.verification_id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-900 text-sm">
                        {getInitialsFromName(v.user_name)}
                      </div>
                      <div className="text-sm text-gray-900 font-medium">
                        {v.user_name || "Anonymous"}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className={`${scheme.cardBg} ${scheme.border} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="text-gray-900 font-medium text-right">{item.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Added on</span>
                  <span className="text-gray-900 font-medium">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}



