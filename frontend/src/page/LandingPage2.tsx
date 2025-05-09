import { useState } from 'react';
import GetStartedModal from '../components/modals/GetStartedModal';
import {

  CheckCircle,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  DollarSign,
  UserCheck,
  PieChart,
  
} from 'lucide-react';

export default function AdsBazerLanding() {
  const [email, setEmail] = useState('');

  // Basic form submission handler for Newsletter
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Subscribed with: ${email}`); // Replace with API call in production
      setEmail('');
    } else {
      alert('Please enter a valid email!');
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(true);
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleGetStartedClick = () => {
    setIsModalOpen(true);
    };


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4B6CB7] to-[#182848]">
      {/* Header/Navigation */}
      <header className=" px-10 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-10 bg-white w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="font-bold text-[#4B6CB7] text-xl">AB</span>
            </div>
            <span className="font-bold text-xl text-white">Ads-Bazer</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-200 hover:text-accent font-medium transition">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-200 hover:text-accent font-medium transition">
              How It Works
            </a>
            <a href="#testimonials" className="text-gray-200 hover:text-accent font-medium transition">
              Testimonials
            </a>
          </nav>
          <div className="flex space-x-4">
            <button className="hidden md:block px-4 py-2 text-accent font-medium hover:text-white transition">
              Log In
            </button>
            <button className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-green-600 transition shadow-md">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className=" h-screen  px-10 py-16 md:py-24">
        <div className="flex flex-col h-full md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 w-full">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Connecting <span className="text-accent">Brands</span> with{' '}
              <span className="text-accent">Influencers</span> on Web3
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              The decentralized marketplace for transparent, efficient, and low-cost influencer marketing campaigns on
              Farcaster and beyond.
            </p>
            <div className="flex flex-col w-48 sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 border rounded-lg overflow-hidden  border-gray-200">
              <button
              onClick={handleGetStartedClick}
               className="px-6 py-3 w-full bg-primary h-full text-white font-medium  hover:bg-green-600 transition shadow-md flex items-center justify-center">
                Get Started <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl opacity-50"></div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-secondary/20 rounded-full filter blur-3xl opacity-50"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-4 z-10">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
                      <h3 className="text-lg font-semibold mt-2">Tech Product Launch</h3>
                    </div>
                    <span className="text-primary font-bold">1,500 cUSD</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-primary mr-2" />
                      <span>10+ influencers needed</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-primary mr-2" />
                      <span>Tech audience, ages 18-35</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle size={16} className="text-primary mr-2" />
                      <span>2 weeks campaign duration</span>
                    </div>
                  </div>
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center">
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    

      {/* Features */}
      <section id="features" className="bg-gray-50 py-16 h-screen md:py-24">
        <div className="container mx-auto px-4 h-full">
          <div className="text-center my-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Why Choose Ads-Bazer</h2>
            <p className="text-xl text-gray-900 max-w-3xl mx-auto">
              A revolutionary platform that leverages Web3 technology to transform influencer marketing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="bg-white p-8 rounded-xl  border-gray-400 shadow-lg border-2 md:h-72">
              <div className="bg-accent/20 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Globe size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Decentralized Marketplace</h3>
              <p className="text-gray-600">
                Connect directly with influencers or brands on Farcaster's social graph without intermediaries or high
                platform fees.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl  md:h-72 mt-28 shadow-lg  border-2 border-gray-400">
              <div className="bg-accent/20 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Shield size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Contract Payments</h3>
              <p className="text-gray-600">
                Secure, transparent payments in cUSD via Celo blockchain, ensuring fair compensation for all parties
                involved.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl md:h-72  shadow-lg  border-2 border-gray-400">
              <div className="bg-accent/20 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Zap size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile-First Experience</h3>
              <p className="text-gray-600">
                Leverage Celo's mobile-friendly blockchain for seamless transactions and campaign management on the go.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How Ads-Bazer Works</h2>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              A streamlined process for creating successful influencer marketing campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Create Campaign</h3>
              <p className="text-gray-200">
                Brands define their campaign details, including content requirements, budget, and target audience.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Connect with Influencers</h3>
              <p className="text-gray-200">
                Verified influencers browse and apply to campaigns that match their audience and content style.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Payments</h3>
              <p className="text-gray-200">
                Smart contracts ensure transparent, low-fee payments in cUSD upon successful campaign completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Benefits for Everyone</h2>
              <p className="text-xl text-gray-600 mb-8">
                Our platform creates value for both brands and influencers in the Web3 ecosystem.
              </p>

              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-accent/20">
                      <DollarSign size={24} className="text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Lower Costs</h3>
                    <p className="mt-2 text-gray-600">
                      Eliminate intermediaries and platform fees, maximizing your marketing budget.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-accent/20">
                      <UserCheck size={24} className="text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Verified Profiles</h3>
                    <p className="mt-2 text-gray-600">
                      Connect with legitimate influencers with verified Farcaster profiles and engagement metrics.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-accent/20">
                      <PieChart size={24} className="text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Transparent Analytics</h3>
                    <p className="mt-2 text-gray-600">
                      Gain clear insights into campaign performance and audience engagement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl opacity-50"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden z-10">
                  <div className="bg-primary p-4 text-white">
                    <h3 className="font-bold text-lg">Campaign Results</h3>
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 font-medium">Reach</span>
                        <span className="text-gray-900 font-semibold">128,500</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 font-medium">Engagement</span>
                        <span className="text-gray-900 font-semibold">24,720</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 font-medium">Conversion</span>
                        <span className="text-gray-900 font-semibold">3,840</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">ROI</p>
                          <p className="text-gray-900 font-bold text-2xl">247%</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Cost per Engagement</p>
                          <p className="text-gray-900 font-bold text-2xl">$0.07</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Marketing?</h2>
            <p className="text-xl text-white/80 mb-8">
              Join brands and influencers already benefiting from Web3-powered marketing campaigns.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="px-8 py-3 bg-white text-primary font-medium rounded-lg hover:bg-gray-100 transition shadow-md w-full sm:w-auto">
                Create an Account
              </button>
              <button className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-primary/80 transition w-full sm:w-auto">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join our newsletter for the latest updates on features, success stories, and Web3 marketing trends.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-l-lg w-full sm:w-2/3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-white font-medium rounded-r-lg hover:bg-green-600 transition w-full sm:w-1/3"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/4 mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="font-bold text-white">AB</span>
                </div>
                <span className="font-bold text-xl">Ads-Bazer</span>
              </div>
              <p className="text-gray-400 mb-6">
                The decentralized marketplace for influencer marketing on Farcaster and Celo.
              </p>
              <div className="flex space-x-4">
                <a href="https://x.com" className="text-gray-400 hover:text-white transition" aria-label="X">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" className="text-gray-400 hover:text-white transition" aria-label="LinkedIn">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="https://github.com" className="text-gray-400 hover:text-white transition" aria-label="GitHub">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.846-2.339 4.697-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="w-full md:w-1/4 mb-8 md:mb-0">
              <h4 className="text-lg font-bold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-white transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition">
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-1/4 mb-8 md:mb-0">
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-1/4">
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Ads-Bazer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <GetStartedModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}