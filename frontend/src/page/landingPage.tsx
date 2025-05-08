import { useState } from 'react';
import { Search, Bell, Menu, User, Briefcase, ChevronRight, TrendingUp, CheckCircle, DollarSign, Target, Calendar, ArrowRight, Clock, Star, Users, Plus, Eye } from 'lucide-react';

export default function AdsBazer() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sample campaign data
  const campaigns = [
    {
      id: 1,
      title: "Summer Product Launch",
      brand: "EcoTech Solutions",
      budget: 1500,
      audience: "Tech enthusiasts, 18-35",
      applicants: 12,
      status: "Active",
      daysLeft: 5
    },
    {
      id: 2,
      title: "Brand Awareness Campaign",
      brand: "Healthy Bytes",
      budget: 2000,
      audience: "Health & fitness, 25-45",
      applicants: 8,
      status: "Active",
      daysLeft: 7
    },
    {
      id: 3,
      title: "Product Review Series",
      brand: "Style Sphere",
      budget: 1200,
      audience: "Fashion enthusiasts, 20-40",
      applicants: 15,
      status: "Active",
      daysLeft: 3
    }
  ];

  // Sample influencer data
  const topInfluencers = [
    {
      name: "Alex Morgan",
      handle: "@techinfluencer",
      followers: "25.2K",
      engagement: "4.8%",
      expertise: "Tech, Gaming",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Jamie Chen",
      handle: "@lifestyleguru",
      followers: "48.6K",
      engagement: "3.9%",
      expertise: "Lifestyle, Travel",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Taylor Reed",
      handle: "@contentcreator",
      followers: "32.1K",
      engagement: "5.2%",
      expertise: "Content Creation, Marketing",
      image: "/api/placeholder/150/150"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-full p-1">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="font-bold text-white">AB</span>
              </div>
            </div>
            <h1 className="text-xl font-bold">Ads-Bazer</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="font-medium hover:text-indigo-200 transition" onClick={() => setActiveTab('dashboard')}>Dashboard</a>
            <a href="#" className="font-medium hover:text-indigo-200 transition" onClick={() => setActiveTab('marketplace')}>Marketplace</a>
            <a href="#" className="font-medium hover:text-indigo-200 transition" onClick={() => setActiveTab('campaigns')}>Campaigns</a>
            <a href="#" className="font-medium hover:text-indigo-200 transition" onClick={() => setActiveTab('analytics')}>Analytics</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-indigo-200 transition">
              <Bell size={20} />
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-indigo-800 flex items-center justify-center">
                  <User size={18} />
                </div>
              </button>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-indigo-800 py-2">
            <nav className="container mx-auto px-4 flex flex-col space-y-2">
              <a href="#" className="py-2 font-medium hover:text-indigo-200 transition" onClick={() => {setActiveTab('dashboard'); setMobileMenuOpen(false);}}>Dashboard</a>
              <a href="#" className="py-2 font-medium hover:text-indigo-200 transition" onClick={() => {setActiveTab('marketplace'); setMobileMenuOpen(false);}}>Marketplace</a>
              <a href="#" className="py-2 font-medium hover:text-indigo-200 transition" onClick={() => {setActiveTab('campaigns'); setMobileMenuOpen(false);}}>Campaigns</a>
              <a href="#" className="py-2 font-medium hover:text-indigo-200 transition" onClick={() => {setActiveTab('analytics'); setMobileMenuOpen(false);}}>Analytics</a>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {activeTab === 'dashboard' && (
          <div className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, Sam!</h2>
              <p className="text-gray-600">Here's what's happening with your campaigns and the marketplace today.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Active Campaigns</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">3</h3>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Briefcase size={20} className="text-indigo-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-4 flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  +2 from last week
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Engaged Influencers</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">24</h3>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users size={20} className="text-green-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-4 flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  +5 from last week
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Total Budget</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">4,700 cUSD</h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <DollarSign size={20} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-blue-600 text-sm mt-4 flex items-center">
                  <Clock size={16} className="mr-1" />
                  Updated just now
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Campaign Performance</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">89%</h3>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp size={20} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-4 flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  +12% from last month
                </p>
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Active Campaigns</h3>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center" onClick={() => setActiveTab('campaigns')}>
                  View All <ChevronRight size={16} className="ml-1" />
                </a>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Audience</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Left</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                                <div className="text-sm text-gray-500">{campaign.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{campaign.budget} cUSD</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{campaign.audience}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.applicants}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.daysLeft} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Influencers */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Top Influencers</h3>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                  View All <ChevronRight size={16} className="ml-1" />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topInfluencers.map((influencer, index) => (
                  <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center">
                        <img src={influencer.image} alt={influencer.name} className="h-12 w-12 rounded-full" />
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">{influencer.name}</h4>
                          <p className="text-sm text-gray-500">{influencer.handle}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Followers</p>
                          <p className="font-medium">{influencer.followers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Engagement</p>
                          <p className="font-medium">{influencer.engagement}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Expertise</p>
                        <p className="font-medium">{influencer.expertise}</p>
                      </div>
                      <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                        View Profile <ArrowRight size={16} className="ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

            {activeTab === 'marketplace' && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Campaign Marketplace</h2>
              <p className="text-gray-600">Discover and apply to ad campaigns from various brands.</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-grow">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search campaigns..."
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <select className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option>All Categories</option>
                    <option>Tech</option>
                    <option>Fashion</option>
                    <option>Lifestyle</option>
                    <option>Food</option>
                    <option>Travel</option>
                  </select>
                  <select className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option>Budget: Any</option>
                    <option>Under 500 cUSD</option>
                    <option>500-1000 cUSD</option>
                    <option>1000-2000 cUSD</option>
                    <option>2000+ cUSD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Available Campaigns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Campaign Card 1 */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full mb-2">Tech</span>
                      <h3 className="text-lg font-semibold text-gray-900">New Smartwatch Promotion</h3>
                      <p className="text-sm text-gray-500">TechGadgets Inc.</p>
                    </div>
                    <span className="text-green-600 font-medium text-sm">1800 cUSD</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      Looking for tech influencers to showcase our latest smartwatch features through unboxing videos and daily usage scenarios.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Target size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Tech enthusiasts</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Ages 18-35</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">2 weeks</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">4 deliverables</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    Apply Now
                  </button>
                </div>
              </div>

              {/* Campaign Card 2 */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full mb-2">Lifestyle</span>
                      <h3 className="text-lg font-semibold text-gray-900">Eco-Friendly Product Line</h3>
                      <p className="text-sm text-gray-500">Green Earth Co.</p>
                    </div>
                    <span className="text-green-600 font-medium text-sm">1200 cUSD</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      Seeking sustainability influencers to promote our new line of eco-friendly home products through creative content.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Target size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Eco-conscious</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Ages 25-45</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">3 weeks</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">3 deliverables</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    Apply Now
                  </button>
                </div>
              </div>

              {/* Campaign Card 3 */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full mb-2">Fashion</span>
                      <h3 className="text-lg font-semibold text-gray-900">Summer Collection Launch</h3>
                      <p className="text-sm text-gray-500">Trendy Styles</p>
                    </div>
                    <span className="text-green-600 font-medium text-sm">2200 cUSD</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      Looking for fashion influencers to showcase our new summer collection through creative photoshoots and styling tips.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Target size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Fashion lovers</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Ages 18-30</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">1 month</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">5 deliverables</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    Apply Now
                  </button>
                </div>
              </div>

              {/* Campaign Card 4 */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full mb-2">Food</span>
                      <h3 className="text-lg font-semibold text-gray-900">Healthy Meal Kit Promotion</h3>
                      <p className="text-sm text-gray-500">Fresh Eats Delivery</p>
                    </div>
                    <span className="text-green-600 font-medium text-sm">1500 cUSD</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      Seeking food influencers to create engaging content showcasing our meal kit preparation and final dishes.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Target size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Food enthusiasts</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Ages 25-40</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">2 weeks</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">3 deliverables</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    Apply Now
                  </button>
                </div>
              </div>

              {/* Campaign Card 5 */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-pink-100 text-pink-800 rounded-full mb-2">Beauty</span>
                      <h3 className="text-lg font-semibold text-gray-900">Skincare Routine Showcase</h3>
                      <p className="text-sm text-gray-500">Glow Natural Beauty</p>
                    </div>
                    <span className="text-green-600 font-medium text-sm">1800 cUSD</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      Looking for beauty influencers to demonstrate our skincare products in their daily routines with before/after results.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Target size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Beauty enthusiasts</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">Ages 20-35</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">4 weeks</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-600">4 deliverables</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    Apply Now
                  </button>
                </div>
              </div>

            </div>
          </div>
            )}

            {activeTab === 'campaigns' && (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Campaigns</h2>
                    <p className="text-gray-600">Manage and track your advertising campaigns</p>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition flex items-center">
                    <Plus size={18} className="mr-2" /> Create New Campaign
                </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicants</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {campaigns.map((campaign) => (
                        <tr key={campaign.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                            <div className="text-sm text-gray-500">{campaign.brand}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {campaign.status}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.budget} cUSD
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.applicants}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap flex space-x-4">
                            <button className="text-indigo-600 hover:text-indigo-900">
                                Edit
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                                View Applicants
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            )}

            {activeTab === 'analytics' && (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Campaign Analytics</h2>
                <p className="text-gray-600">Performance metrics and insights for your campaigns</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Performance Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Engagement Overview</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Engagement chart placeholder</span>
                    </div>
                </div>

                {/* Metrics Overview */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-gray-500">Total Impressions</p>
                        <p className="text-2xl font-bold mt-1">24.5K</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-lg">
                        <Eye size={20} className="text-green-600" />
                        </div>
                    </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-gray-500">Click-Through Rate</p>
                        <p className="text-2xl font-bold mt-1">3.8%</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg">
                      
                        </div>
                    </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-gray-500">Avg. Cost per Click</p>
                        <p className="text-2xl font-bold mt-1">0.42 cUSD</p>
                        </div>
                        <div className="bg-purple-100 p-2 rounded-lg">
                        <DollarSign size={20} className="text-purple-600" />
                        </div>
                    </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-gray-500">Conversion Rate</p>
                        <p className="text-2xl font-bold mt-1">1.2%</p>
                        </div>
                        <div className="bg-pink-100 p-2 rounded-lg">
                        <TrendingUp size={20} className="text-pink-600" />
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                {/* Influencer Performance */}
                <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Influencers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topInfluencers.map((influencer, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center mb-3">
                        <img src={influencer.image} alt={influencer.name} className="h-10 w-10 rounded-full" />
                        <div className="ml-3">
                            <p className="font-medium">{influencer.name}</p>
                            <p className="text-sm text-gray-500">{influencer.handle}</p>
                        </div>
                        </div>
                        <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{influencer.followers} followers</span>
                        <span className="flex items-center">
                            <Star size={14} className="mr-1 text-yellow-500" />
                            {influencer.engagement}
                        </span>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            )}
     </main>

     </div>
    );    
}
              