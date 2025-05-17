
// import AdsBazer from './page/landingPage'
import AdsBazerLanding from './page/LandingPage2'
import Root from './Root';
import SelfVerificationPage from './page/SelfVerificationPage';
import CreatorsPage from './page/CreatorsPage';
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";


import './App.css'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<AdsBazerLanding />} />
        <Route path="selfverification" element={<SelfVerificationPage/>} />
        <Route path="creators" element={<CreatorsPage/>} />
        
        {/* <Route path="buyersPage" element={<BuyersPage />}>
          <Route path="cardetails/:id" element={<CarDetailsPage />} />
        </Route> */}
      </Route>
    )
  );

   
  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
