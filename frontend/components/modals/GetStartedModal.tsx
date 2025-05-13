import { useState } from 'react'
import { X, Twitter, Facebook, Youtube, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation';

interface GetStartedModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type UserType = 'influencer' | 'advertiser';
type SocialPlatform = 'farcaster' | 'twitter' | 'facebook' | 'youtube';

interface UserDetails {
  userType: UserType | '';
  niche?: string;
  connectedPlatforms?: SocialPlatform[];
  businessType?: string;
  budget?: string;
}

const GetStartedModal = ({ isOpen = true, onClose = () => {} }: GetStartedModalProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    userType: '',
    connectedPlatforms: [],
  });

  const router = useRouter();
  
  const [showNextStep, setShowNextStep] = useState(false);
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  
  const handleUserTypeSelection = (type: UserType) => {
    setUserDetails({...userDetails, userType: type});
    setShowNextStep(true);
  }
  
  const handleBack = () => {
    setShowNextStep(false);
  }

  const handleConnect = (platform: SocialPlatform) => {
    setConnecting(platform);
    
    // Simulate connection process
    setTimeout(() => {
      const connectedPlatforms = userDetails.connectedPlatforms || [];
      if (!connectedPlatforms.includes(platform)) {
        setUserDetails({
          ...userDetails,
          connectedPlatforms: [...connectedPlatforms, platform]
        });
      }
      setConnecting(null);
    }, 1000);
  }
  
  const handleDisconnect = (platform: SocialPlatform) => {
    const connectedPlatforms = userDetails.connectedPlatforms || [];
    setUserDetails({
      ...userDetails,
      connectedPlatforms: connectedPlatforms.filter(p => p !== platform)
    });
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Get Started</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {!showNextStep ? (
          <div className="space-y-6">
            <p className="text-gray-600">What best describes you?</p>
            
            <div className="space-y-4">
              <button
                onClick={() => handleUserTypeSelection('influencer')}
                className="w-full p-4 border-2 border-blue-500 rounded-lg flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-medium text-lg text-gray-800">I'm an Influencer</h3>
                  <p className="text-gray-600 text-sm">I want to monetize my audience and work with brands</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-blue-500"></div>
              </button>
              
              <button
                onClick={() => handleUserTypeSelection('advertiser')}
                className="w-full p-4 border-2 border-blue-500 rounded-lg flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-medium text-lg text-gray-800">I want to run ads</h3>
                  <p className="text-gray-600 text-sm">I'm looking to promote my business or product</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-blue-500"></div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600">
              {userDetails.userType === 'influencer' 
                ? "Great! Let's set up your influencer profile" 
                : "Great! Let's set up your advertising account"}
            </p>
            
            <div className="space-y-4 text-gray-600">
              {userDetails.userType === 'influencer' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niche/Category</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={userDetails.niche || ''}
                      onChange={(e) => setUserDetails({...userDetails, niche: e.target.value})}
                    >
                      <option value="">Select a category</option>
                      <option value="fashion">Fashion & Style</option>
                      <option value="beauty">Beauty & Cosmetics</option>
                      <option value="fitness">Fitness & Health</option>
                      <option value="travel">Travel & Lifestyle</option>
                      <option value="food">Food & Cooking</option>
                      <option value="tech">Technology</option>
                      <option value="gaming">Gaming</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Connect Your Social Media</label>
                    <div className="space-y-3">
                      {/* Farcaster */}
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <Share2 size={18} className="text-purple-600" />
                          </div>
                          <span className="font-medium">Farcaster</span>
                        </div>
                        {userDetails.connectedPlatforms?.includes('farcaster') ? (
                          <button 
                            onClick={() => handleDisconnect('farcaster')}
                            className="py-1 px-3 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConnect('farcaster')}
                            disabled={connecting === 'farcaster'}
                            className="py-1 px-3 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                          >
                            {connecting === 'farcaster' ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                      
                      {/* X (Twitter) */}
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-black p-2 rounded-full mr-3">
                            <Twitter size={18} className="text-white" />
                          </div>
                          <span className="font-medium">X (Twitter)</span>
                        </div>
                        {userDetails.connectedPlatforms?.includes('twitter') ? (
                          <button 
                            onClick={() => handleDisconnect('twitter')}
                            className="py-1 px-3 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConnect('twitter')}
                            disabled={connecting === 'twitter'}
                            className="py-1 px-3 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-600"
                          >
                            {connecting === 'twitter' ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                      
                      {/* Facebook */}
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-blue-600 p-2 rounded-full mr-3">
                            <Facebook size={18} className="text-white" />
                          </div>
                          <span className="font-medium">Facebook</span>
                        </div>
                        {userDetails.connectedPlatforms?.includes('facebook') ? (
                          <button 
                            onClick={() => handleDisconnect('facebook')}
                            className="py-1 px-3 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConnect('facebook')}
                            disabled={connecting === 'facebook'}
                            className="py-1 px-3 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                          >
                            {connecting === 'facebook' ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                      
                      {/* YouTube */}
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-red-600 p-2 rounded-full mr-3">
                            <Youtube size={18} className="text-white" />
                          </div>
                          <span className="font-medium">YouTube</span>
                        </div>
                        {userDetails.connectedPlatforms?.includes('youtube') ? (
                          <button 
                            onClick={() => handleDisconnect('youtube')}
                            className="py-1 px-3 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConnect('youtube')}
                            disabled={connecting === 'youtube'}
                            className="py-1 px-3 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
                          >
                            {connecting === 'youtube' ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={userDetails.businessType || ''}
                      onChange={(e) => setUserDetails({...userDetails, businessType: e.target.value})}
                    >
                      <option value="">Select business type</option>
                      <option value="ecommerce">E-commerce Store</option>
                      <option value="local">Local Business</option>
                      <option value="software">Software/App</option>
                      <option value="service">Service Provider</option>
                      <option value="personal">Personal Brand</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Ad Budget</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={userDetails.budget || ''}
                      onChange={(e) => setUserDetails({...userDetails, budget: e.target.value})}
                    >
                      <option value="">Select budget range</option>
                      <option value="under500">Less than $500</option>
                      <option value="500-2000">$500 - $2,000</option>
                      <option value="2000-5000">$2,000 - $5,000</option>
                      <option value="5000-10000">$5,000 - $10,000</option>
                      <option value="10000plus">$10,000+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button 
                onClick={handleBack}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => {
                  // Check if user can continue based on required fields
                  const canContinue = userDetails.userType === 'influencer' 
                    ? !!userDetails.niche && (userDetails.connectedPlatforms?.length || 0) > 0
                    : !!userDetails.businessType && !!userDetails.budget;
                    
                  if (canContinue) {
                    console.log('User can continue, submitting data:', userDetails);
                    onClose();
                    router.push('/selfverification');
                  } else {
                    alert('Please fill out all required fields to continue');
                  }
                }}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GetStartedModal