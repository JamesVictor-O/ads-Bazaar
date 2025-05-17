export const TaskStatusIcon = ({ status }) => {
    const icon = {
      completed: <CheckCircle className="text-green-500" />,
      'in progress': <Clock className="text-yellow-500" />,
      pending: <AlertCircle className="text-gray-400" />
    }[status];
  
    return <div className="mr-2">{icon}</div>;
  };