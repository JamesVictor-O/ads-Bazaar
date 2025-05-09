import { Outlet } from "react-router-dom";


const Root = () => {
  return (
    <div>
      
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 h-full">
        <Outlet />
      </div>
    </div>
  );
};

export default Root;