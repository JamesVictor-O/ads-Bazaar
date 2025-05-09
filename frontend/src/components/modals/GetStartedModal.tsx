import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom';

interface GetStartedModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type UserType = 'influencer' | 'advertiser';

interface UserDetails {
  userType: UserType | '';
  niche?: string;
  platforms?: string[];
  businessType?: string;
  budget?: string;
}

const GetStartedModal = ({ isOpen = true, onClose = () => {} }: GetStartedModalProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    userType: '',
  });
  const navigate = useNavigate();
  const [showNextStep, setShowNextStep] = useState(false);
  const handleUserTypeSelection = (type: UserType) => {
    setUserDetails({...userDetails, userType: type});
    setShowNextStep(true);
  }
  
  const handleBack = () => {
    setShowNextStep(false)
  }

  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
            
            <div className="space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Platforms</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="instagram" 
                          className="mr-2"
                          checked={userDetails.platforms?.includes('instagram') || false}
                          onChange={(e) => {
                            const platforms = userDetails.platforms || [];
                            if (e.target.checked) {
                              setUserDetails({...userDetails, platforms: [...platforms, 'instagram']});
                            } else {
                              setUserDetails({...userDetails, platforms: platforms.filter(p => p !== 'instagram')});
                            }
                          }}
                        />
                        <label htmlFor="instagram">Instagram</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="tiktok" 
                          className="mr-2"
                          checked={userDetails.platforms?.includes('tiktok') || false}
                          onChange={(e) => {
                            const platforms = userDetails.platforms || [];
                            if (e.target.checked) {
                              setUserDetails({...userDetails, platforms: [...platforms, 'tiktok']});
                            } else {
                              setUserDetails({...userDetails, platforms: platforms.filter(p => p !== 'tiktok')});
                            }
                          }}
                        />
                        <label htmlFor="tiktok">TikTok</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="youtube" 
                          className="mr-2"
                          checked={userDetails.platforms?.includes('youtube') || false}
                          onChange={(e) => {
                            const platforms = userDetails.platforms || [];
                            if (e.target.checked) {
                              setUserDetails({...userDetails, platforms: [...platforms, 'youtube']});
                            } else {
                              setUserDetails({...userDetails, platforms: platforms.filter(p => p !== 'youtube')});
                            }
                          }}
                        />
                        <label htmlFor="youtube">YouTube</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="twitter" 
                          className="mr-2"
                          checked={userDetails.platforms?.includes('twitter') || false}
                          onChange={(e) => {
                            const platforms = userDetails.platforms || [];
                            if (e.target.checked) {
                              setUserDetails({...userDetails, platforms: [...platforms, 'twitter']});
                            } else {
                              setUserDetails({...userDetails, platforms: platforms.filter(p => p !== 'twitter')});
                            }
                          }}
                        />
                        <label htmlFor="twitter">Twitter</label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option>E-commerce Store</option>
                      <option>Local Business</option>
                      <option>Software/App</option>
                      <option>Service Provider</option>
                      <option>Personal Brand</option>
                      <option>Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Ad Budget</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option>Less than $500</option>
                      <option>$500 - $2,000</option>
                      <option>$2,000 - $5,000</option>
                      <option>$5,000 - $10,000</option>
                      <option>$10,000+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button 
                onClick={handleBack}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => {
                  // Check if user can continue based on required fields
                  const canContinue = userDetails.userType === 'influencer' 
                    ? !!userDetails.niche && (userDetails.platforms?.length || 0) > 0
                    : !!userDetails.businessType && !!userDetails.budget;
                    
                  if (canContinue) {
                    console.log('User can continue, submitting data:', userDetails);
                    onClose();
                    navigate("selfverification")
                     
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