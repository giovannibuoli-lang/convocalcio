import React, { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const addNotification = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    if(duration > 0) setTimeout(()=> setNotifications(prev=>prev.filter(n=>n.id!==id)), duration);
    return id;
  };
  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div style={{
        position:"fixed",right:32,top:32,zIndex:1100,display:"flex",flexDirection:"column",gap:10,alignItems:"end"
      }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background:
              n.type==="success"?"#35d073":
              n.type==="error"?"#ea3d3d":
              n.type==="warning"?"#FDBA21":
              "#1976d2",
            color:"#fff",padding:"13px 24px",borderRadius:9,boxShadow:"0 4px 16px #90caf950",fontWeight:580,fontSize:16,minWidth:190,cursor:"pointer",
          }}>{n.message}</div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
