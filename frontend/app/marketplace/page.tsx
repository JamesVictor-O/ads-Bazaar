import React from "react";
import { Search, CheckCircle, Target, Calendar, Users } from "lucide-react";

const Marketplace = () => {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 min-h-screen">
      <div className="px-6 py-10 ">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-300 mb-2">
            Campaign Marketplace
          </h2>
          <p className="text-gray-300">
            Discover and apply to campaigns that match your influencer profile.
          </p>
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 text-gray-600 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search campaigns..."
                />
              </div>
            </div>
            <div className="flex space-x-4 text-gray-600">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Campaign Card 1 */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full mb-2">
                    Tech
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    New Smartwatch Promotion
                  </h3>
                  <p className="text-sm text-gray-500">TechGadgets Inc.</p>
                </div>
                <span className="text-green-600 font-medium text-sm">
                  1800 cUSD
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  Looking for tech influencers to showcase our latest smartwatch
                  features through unboxing videos and daily usage scenarios.
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
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full mb-2">
                    Lifestyle
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Eco-Friendly Product Line
                  </h3>
                  <p className="text-sm text-gray-500">Green Earth Co.</p>
                </div>
                <span className="text-green-600 font-medium text-sm">
                  1200 cUSD
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  Seeking sustainability influencers to promote our new line of
                  eco-friendly home products through creative content.
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
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full mb-2">
                    Fashion
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Summer Collection Launch
                  </h3>
                  <p className="text-sm text-gray-500">Trendy Styles</p>
                </div>
                <span className="text-green-600 font-medium text-sm">
                  2200 cUSD
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  Looking for fashion influencers to showcase our new summer
                  collection through creative photoshoots and styling tips.
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
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full mb-2">
                    Food
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Healthy Meal Kit Promotion
                  </h3>
                  <p className="text-sm text-gray-500">Fresh Eats Delivery</p>
                </div>
                <span className="text-green-600 font-medium text-sm">
                  1500 cUSD
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  Seeking food influencers to create engaging content showcasing
                  our meal kit preparation and final dishes.
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
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-pink-100 text-pink-800 rounded-full mb-2">
                    Beauty
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Skincare Routine Showcase
                  </h3>
                  <p className="text-sm text-gray-500">Glow Natural Beauty</p>
                </div>
                <span className="text-green-600 font-medium text-sm">
                  1800 cUSD
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  Looking for beauty influencers to demonstrate our skincare
                  products in their daily routines with before/after results.
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
    </div>
  );
};

export default Marketplace;
