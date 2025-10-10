import React, { useState, useEffect } from "react";
import { MdGroups, MdPerson, MdEvent, MdLogout, MdEdit, MdClose } from "react-icons/md";
import { FaFutbol, FaWhistle, FaUserShield, FaCheckCircle, FaQuestionCircle, FaTimesCircle, FaRunning } from 'react-icons/fa';
import { MdSportsSoccer, MdOutlineSportsKabaddi } from 'react-icons/md';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { useNotification } from "./NotificationContext";
import { GiSoccerField } from 'react-icons/gi';
import { FaFootballBall } from 'react-icons/fa';

const COLORS = {
  primary: "#1976d2", blue: "#2196F3", accent: "#45b6fe", background: "#f4f7fa", panel: "#fff",
  text: "#222", textDim: "#637381", error: "#ea3d3d", warning: "#FDBA21", success: "#35d073", shadow: "0 4px 16px #90caf950"
};

const StyleInjector = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      body{margin:0;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;background:#f4f7fa;color:#222;}
      .input-modern{padding:14px 18px;border:1.3px solid #B0BEC4;border-radius:11px;font-size:17px;background:#fff;}
      .input-modern:focus{border-color:#1976d2;box-shadow:0 0 0 3px #1976d241;}
      .btn-primary{background:linear-gradient(90deg,#1e40af 30%,#22c55e 95%);color:#fff;border:none;border-radius:13px;padding:14px 28px;font-size:17px;font-weight:700;box-shadow:0 3px 14px #1976d22c;cursor:pointer;transition:box-shadow .16s;}
      .btn-primary:hover{background:linear-gradient(90deg, #1976d2 30%,#15803d 95%);box-shadow:0 8px 32px #1b93421f;}
      .btn-secondary{background:#edf6fb;color:#1976d2;border:1.4px solid #B0BEC4;border-radius:10px;padding:11px 22px;font-size:16px;font-weight:600;cursor:pointer;}
      .btn-secondary:hover{border-color:#1976d2;background:#e4ecff;}
      .panel-main{background:#fff;box-shadow:0 8px 34px #1646601c;border-radius:29px;padding:45px 42px 28px 42px;margin:49px auto;max-width:990px;min-width:340px;}
      .section-header{font-size:23px;color:#15803d;font-weight:900;margin-bottom:24px;display:flex;align-items:center;gap:16px;letter-spacing:.019em;}
      .card-item{background:#f7fafc;border:1.2px solid #e0e5ed;border-radius:15px;padding:20px 15px;margin-bottom:16px;box-shadow:0 2.5px 14px #15803d15;cursor:pointer;transition:box-shadow .18s,border-color .11s;display:flex;align-items:center;}
      .card-item:hover{border-color:#1976d2;box-shadow:0 12px 34px #1976d223;}
      .socc-icon{color:#1976d2;font-size:35px;margin-right:14px;}
      @media (max-width: 700px) {
        .panel-main { max-width: 99vw; min-width: unset; padding: 18vw 2vw 4vw 2vw; box-shadow: 0 2.5px 14px #1646600a; margin: 0 auto; border-radius: 0; }
        .section-header { font-size: 19px; }
        .card-item { border-radius: 8px; padding:14px 8px; font-size:14.5px; }
        .btn-primary, .btn-secondary { font-size:15px; padding:11px 14px; border-radius:8px; }
        .socc-icon { font-size: 25px; margin-right:7px; }
      }
      @media (max-width: 480px) {
        .panel-main { padding: 11vw 2vw 4vw 2vw; }
        .section-header { font-size: 17px; gap:7px; }
        .card-item { flex-direction:column; gap:10px; }
        .btn-primary, .btn-secondary { width:100%; box-sizing:border-box; margin-top:8px; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

const Input = ({ value, onChange, placeholder, type = "text", ...props }) => (
  <input className="input-modern" type={type} placeholder={placeholder} value={value} onChange={onChange} {...props} />
);
const Select = ({ value, onChange, options, placeholder, ...props }) => (
  <select className="input-modern" value={value} onChange={onChange} {...props}>
    <option value="">{placeholder}</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);
const Button = ({ title, onPress, variant = "primary", icon = null, style = {}, disabled = false }) => {
  const cls = variant === "secondary" ? "btn-secondary" : "btn-primary";
  return (
    <button className={cls} onClick={!disabled ? onPress : undefined} disabled={disabled} style={style}>
      {icon && <span style={{marginRight:10,verticalAlign:"middle"}}>{icon}</span>}
      {title}
    </button>
  );
};
const Modal = ({ open, onClose, children }) =>
  open ? (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "#0005", zIndex: 2001, display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 15, boxShadow: COLORS.shadow, padding: 28, minWidth: 330, maxWidth: "97vw", position: "relative"
      }}>
        <button title="Chiudi" onClick={onClose} style={{position:"absolute",right:12,top:7,background:"none",border:"none",fontSize:24,fontWeight:700,color:COLORS.textDim,cursor:"pointer"}}><MdClose/></button>
        {children}
      </div>
    </div>
  ) : null;

const LogoutButton = ({ onLogout }) => (
  <button onClick={onLogout} title="Esci" style={{
    position:"absolute",top:18,right:28,background:"none",border:"none",fontSize:29,color:COLORS.textDim,cursor:"pointer",zIndex:105
  }}><MdLogout/></button>
);

const PlayerCard = ({ player, editable = false, onEdit, onDelete, response }) => (
  <div className="card-item" style={{flexDirection:"row", alignItems:'center'}}>
    {player.position === 'Portiere' && <FaUserShield style={{fontSize:28,marginRight:10,color:"#3b82f6"}} />}
    {player.position === 'Difensore' && <FaRunning style={{fontSize:28,marginRight:10,color:"#227bbf"}} />}
    {player.position === 'Centrocampista' && <FaFutbol style={{fontSize:28,marginRight:10,color:"#1ed760"}} />}
    {player.position === 'Attaccante' && <MdSportsSoccer style={{fontSize:28,marginRight:10,color:"#fc8803"}} />}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 17 }}>{player.firstName} {player.lastName}</div>
      <div style={{ color: "#637381", fontSize: 15 }}>
        {player.position} • Maglia {player.jerseyNumber || "?"}
      </div>
    </div>
    {response === "partecipo" && <FaCheckCircle title="Partecipo" style={{color:'green',fontSize:24,marginRight:6}} />}
    {response === "incerto" && <FaQuestionCircle title="Incerto" style={{color:'orange',fontSize:24,marginRight:6}} />}
    {response === "no" && <FaTimesCircle title="Non partecipa" style={{color:'red',fontSize:24,marginRight:6}} />}
    {editable &&
      <div style={{ display: "flex", gap: 9 }}>
        <Button variant="secondary" icon={<MdEdit/>} title="" onPress={() => onEdit(player)} style={{fontSize:16, padding:"6px 10px"}} />
        <Button variant="secondary" icon={<MdClose/>} title="" onPress={() => onDelete(player)} style={{fontSize:16,padding:"6px 10px"}} />
      </div>}
  </div>
);

const AdminDashboard = ({
  teams,
  players,
  events,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onCreatePlayer,
  onEditPlayer,
  onDeletePlayer,
  onAnswer,
  user,
  onLogout
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || "");
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const sectionHeader = (text) => {
    let Icon, color;
    if (text === "Squadre") { Icon = MdGroups; color = "#1769aa"; }
    else if (text === "Giocatori") { Icon = FaRunning; color = "#15803d"; }
    else if (text === "Eventi/Convocazioni") { Icon = GiSoccerField; color = "#e57300"; }
    else { Icon = FaFootballBall; color = "#222"; }
    return (
      <div className="section-header" style={{gap:14}}>
        <Icon style={{color, fontSize:34, marginRight:10}} />
        {text}
      </div>
    );
  };

  const teamEvents = events.filter(e => e.teamId === selectedTeamId);
  const teamPlayers = players.filter(p => p.teamId === selectedTeamId);

  const mandaPromemoria = (event) => {
    alert("Sollecito inviato ai non rispondenti dell'evento: " + event.title);
  };

  return (
    <div className="panel-main" style={{ position: "relative" }}>
      <LogoutButton onLogout={onLogout} />

      {sectionHeader("Squadre")}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <Select
          value={selectedTeamId}
          onChange={e => setSelectedTeamId(e.target.value)}
          options={teams.map(t => ({ value: t.id, label: t.name }))}
          placeholder="Seleziona squadra..."
        />
        <Button title="Aggiungi squadra" icon={<MdGroups />} onPress={onCreateTeam} />
      </div>
      <div>
        {teams.map(team => (
          <div key={team.id} className="card-item" style={{ border: team.id === selectedTeamId ? "2.4px solid #1976d2" : undefined }}>
            <div style={{ flex: 1 }}>
              <b>{team.name}</b> <span style={{ color: "#637381" }}>{team.category}</span>
            </div>
            <Button variant="secondary" icon={<MdEdit />} title="" onPress={() => onEditTeam(team)} />
            <Button variant="secondary" icon={<MdClose />} title="" onPress={() => onDeleteTeam(team)} />
          </div>
        ))}
      </div>

      {sectionHeader("Giocatori")}
      <Button title="Aggiungi giocatore" icon={<MdPerson />} onPress={onCreatePlayer} style={{ marginBottom: 14 }} />
      <div>
        {teamPlayers.length === 0 && <div style={{ color: "#aaa" }}>Nessun giocatore in questa squadra.</div>}
        {teamPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            editable
            onEdit={onEditPlayer}
            onDelete={onDeletePlayer}
          />
        ))}
      </div>

      {sectionHeader("Eventi/Convocazioni")}
      <Button title="Crea evento" icon={<MdEvent />} onPress={onCreateEvent} style={{ marginBottom: 14 }} />
      <div>
        {teamEvents.length === 0 && <div style={{ color: "#aaa" }}>Nessun evento per questa squadra.</div>}
        {teamEvents.map(event => (
          <div key={event.id} className="card-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 9 }}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              {(event.type==="allenamento") && <FaFutbol size={22} color="#2196F3" />}
              {(event.type==="partita") && <MdSportsSoccer size={22} color="#e22929" />}
              {(event.type==="amichevole") && <MdOutlineSportsKabaddi size={22} color="#e39d1a" />}
              <div style={{ fontWeight: 700, fontSize: 17 }}>
                {event.title}
                <span style={{ color: "#147347", fontWeight: 600, fontSize: "15px", marginLeft: 8 }}>{event.type}</span>
              </div>
            </div>
            <div style={{ color: "#556", fontSize: 15, marginTop: 2 }}>
              {event.date} {event.startTime && `• ${event.startTime}`} {event.location && `- ${event.location.name}`}
            </div>
            <div style={{ display: "flex", gap: 8, margin: "5px 0 0 0" }}>
              <Button title="" icon={<MdEdit />} variant="secondary" onPress={() => onEditEvent(event)} />
              <Button title="" icon={<MdClose />} variant="secondary" onPress={() => onDeleteEvent(event)} />
              <Button title="Manda sollecito ai non rispondenti" onPress={() => mandaPromemoria(event)} />
            </div>
            <div style={{
              marginTop: 8,
              background: "#f7fdfd",
              border: "1.1px solid #b4ebcd",
              borderRadius: 10,
              padding: "14px 14px",
              width: "100%",
              minHeight: "65px",
              boxSizing: "border-box"
            }}>
              <div style={{
                fontWeight: 600,
                marginBottom: 12,
                color: "#147347",
                fontSize: 17
              }}>Risposte giocatori:</div>
              {teamPlayers.map(p => {
                const responseObj = (event.responses || []).find(r => r.playerId === p.id);
                return (
                  <div key={p.id} className="card-item" style={{
                    marginBottom: '10px',
                    width: "100%",
                    boxSizing: "border-box"
                  }}>
                    <PlayerCard
                      player={p}
                      response={responseObj?.response}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlayerDashboard = ({ teams, events, player, onSendResponse, onLogout }) => {
  const [selectedTeamId, setSelectedTeamId] = useState(player?.teamId || teams[0]?.id || "");
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamEvents = events.filter(e => e.teamId === selectedTeamId);

  function getPlayerResponseIcon(event) {
    const resp = (event.responses || []).find(r => r.playerId === player.id);
    if(!resp) return <span style={{color:"#888"}}>Non risposto</span>;
    if(resp.response === "partecipo") return <FaCheckCircle color="green" title="Partecipo" style={{fontSize:22,marginRight:4}} />;
    if(resp.response === "incerto")   return <FaQuestionCircle color="orange" title="Incerto" style={{fontSize:22,marginRight:4}} />;
    if(resp.response === "no")        return <FaTimesCircle color="red" title="Non partecipa" style={{fontSize:22,marginRight:4}} />;
    return <span>{resp.response}</span>;
  }

  return (
    <div className="panel-main" style={{ position: "relative" }}>
      <LogoutButton onLogout={onLogout} />
      <div className="section-header"><FaFutbol className="socc-icon"/>Ciao {player.firstName}!</div>
      <div style={{fontSize:18,marginBottom:19}}>
        Squadra: <b>{selectedTeam?.name}</b> <span style={{color:"#147347"}}>{selectedTeam?.category}</span>
      </div>
      <div className="section-header"><FaFutbol className="socc-icon"/>Eventi & Convocazioni</div>
      {teamEvents.length === 0 && <div style={{ color: "#aaa" }}>Nessun evento per la tua squadra.</div>}
      {teamEvents.map(event => (
        <div key={event.id} className="card-item" style={{flexDirection:"column",alignItems:"flex-start",marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            {(event.type==="allenamento") && <FaFutbol size={22} color="#2196F3" />}
            {(event.type==="partita") && <MdSportsSoccer size={22} color="#e22929" />}
            {(event.type==="amichevole") && <MdOutlineSportsKabaddi size={22} color="#e39d1a" />}
            <div style={{fontWeight:700,fontSize:17}}>{event.title}
              <span style={{color:"#1976d2",marginLeft:7,fontWeight:600}}>{event.type}</span>
            </div>
          </div>
          <div style={{color:"#556",fontSize:14,marginTop:2}}>
            {event.date} {event.startTime && `• ${event.startTime}`} {event.location && `- ${event.location.name}`}
          </div>
          <div style={{display:"flex",gap:13,margin:"8px 0"}}>
            <Button title="Partecipo" onPress={() => onSendResponse(event.id, "partecipo")} />
            <Button title="Incerto" variant="secondary" onPress={() => onSendResponse(event.id, "incerto")} />
            <Button title="Non riesco a partecipare" variant="secondary" onPress={() => onSendResponse(event.id, "no")} />
          </div>
          <div style={{
            marginTop:7,
            background:"#e2f7e9",
            borderRadius:7,
            padding:"6px 14px",
            color:"#15803d",
            fontWeight:600,
            fontSize:14,
            display:'flex',
            alignItems:'center',
            maxWidth: "520px",
            margin: "8px auto"
          }}>
            La tua risposta: {getPlayerResponseIcon(event)}
          </div>
        </div>
      ))}
    </div>
  );
};
const TeamFormModal = ({ open, team, onSave, onClose }) => {
  // ... (incolla tutto il codice già fornito per TeamFormModal)
};
const EventFormModal = ({ open, event, teams, onSave, onClose }) => {
  // ... (incolla tutto il codice fornito)
};
const PlayerFormModal = ({ open, player, teams, onSave, onClose }) => {
  // ... (incolla tutto il codice fornito)
};
const DemoLogin = ({ onAdmin, onPlayer }) => {
  // ... (incolla tutto il codice fornito)
};

const ConvoCalcio = () => {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubPlayers = onSnapshot(collection(db, "players"), (snap) => {
      setPlayers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubTeams(); unsubPlayers(); unsubEvents(); }
  }, []);

  useEffect(()=>{
    const u = localStorage.getItem("userdemo");
    if(u){setUser(JSON.parse(u));setScreen(JSON.parse(u).type);}
  }, []);
  const handleDemoLogin = (username) => {
    if(username.toLowerCase().includes("admin")) {
      setUser({ type: "admin", username: username });
      setScreen("admin");
      localStorage.setItem("userdemo", JSON.stringify({ type: "admin", username }));
    } else {
      let pl = players.find(p=>p.username===username);
      if(!pl){
        const id = `${Date.now()}${Math.floor(Math.random()*99999)}`;
        pl = { id, username, firstName: username, lastName: "", teamId: teams[0]?.id||"", position: "Attaccante" };
        addDoc(collection(db, "players"), pl);
      }
      setUser({ type: "player", ...pl });
      setScreen("player");
      localStorage.setItem("userdemo", JSON.stringify({ type:"player", ...pl }));
    }
  };
  const handleLogout = () => {
    setUser(null); setScreen("login"); localStorage.removeItem("userdemo");
  };

  const onCreateTeam = () => { setEditTeam(null); setShowTeamModal(true); };
  const onEditTeam = (team) => { setEditTeam(team); setShowTeamModal(true); };
  const onDeleteTeam = (team) => { deleteDoc(doc(db, "teams", team.id)); addNotification("Squadra eliminata!", "success"); };
  const handleSaveTeam = async (team) => {
    if(team.id){await updateDoc(doc(db,"teams",team.id), team);}
    else{await addDoc(collection(db,"teams"), team);}
    setShowTeamModal(false); addNotification("Squadra salvata!", "success");
  };

  const onCreatePlayer = () => { setEditPlayer(null); setShowPlayerModal(true); };
  const onEditPlayer = (pl) => { setEditPlayer(pl); setShowPlayerModal(true); };
  const onDeletePlayer = (pl) => { deleteDoc(doc(db, "players", pl.id)); addNotification("Giocatore eliminato!", "success"); };
  const handleSavePlayer = async (pl) => {
    if(pl.id){await updateDoc(doc(db,"players",pl.id), pl);}
    else{await addDoc(collection(db,"players"), pl);}
    setShowPlayerModal(false); addNotification("Giocatore salvato!", "success");
  };

  const onCreateEvent = () => { setEditEvent(null); setShowEventModal(true); };
  const onEditEvent = (ev) => { setEditEvent(ev); setShowEventModal(true); };
  const onDeleteEvent = (ev) => { deleteDoc(doc(db, "events", ev.id)); addNotification("Evento eliminato!", "success"); };
  const handleSaveEvent = async (ev) => {
    if(ev.id){await updateDoc(doc(db,"events",ev.id), ev);}
    else{await addDoc(collection(db,"events"), ev);}
    setShowEventModal(false); addNotification("Evento salvato!", "success");
  };

  const handleAnswer = async (answer, eventId) => {
    const event = events.find(e=>e.id===eventId);
    if(!event) return;
    let responses = event.responses || [];
    let playerId = user.type==="admin"?players[0]?.id:user.id;
    if(!playerId) return;
    responses = responses.filter(r=>r.playerId!==playerId);
    responses.push({ playerId, response: answer });
    await updateDoc(doc(db, "events", eventId), { ...event, responses });
    addNotification("Risposta registrata!", "success");
  };

  const handlePlayerResponse = async (eventId, answer) => {
    const event = events.find(e=>e.id===eventId);
    if(!event || !user?.id) return;
    let responses = event.responses || [];
    responses = responses.filter(r=>r.playerId!==user.id);
    responses.push({ playerId: user.id, response: answer });
    await updateDoc(doc(db, "events", eventId), { ...event, responses });
    addNotification("Risposta salvata!", "success");
  };

  const teamModal = <TeamFormModal open={showTeamModal} team={editTeam} onSave={handleSaveTeam} onClose={()=>setShowTeamModal(false)} />;
  const playerModal = <PlayerFormModal open={showPlayerModal} player={editPlayer} teams={teams} onSave={handleSavePlayer} onClose={()=>setShowPlayerModal(false)} />;
  const eventModal = <EventFormModal open={showEventModal} event={editEvent} teams={teams} onSave={handleSaveEvent} onClose={()=>setShowEventModal(false)} />;

  return (
    <>
      <StyleInjector />
      {teamModal}{playerModal}{eventModal}
      {screen==="login" && <DemoLogin onAdmin={handleDemoLogin} onPlayer={handleDemoLogin} />}
      {screen==="admin" && user && (
        <AdminDashboard
          teams={teams}
          players={players}
          events={events}
          user={user}
          onCreateTeam={onCreateTeam}
          onEditTeam={onEditTeam}
          onDeleteTeam={onDeleteTeam}
          onCreatePlayer={onCreatePlayer}
          onEditPlayer={onEditPlayer}
          onDeletePlayer={onDeletePlayer}
          onCreateEvent={onCreateEvent}
          onEditEvent={onEditEvent}
          onDeleteEvent={onDeleteEvent}
          onAnswer={handleAnswer}
          onLogout={handleLogout}
        />
      )}
      {screen==="player" && user && (
        <PlayerDashboard
          teams={teams}
          events={events}
          player={user}
          onSendResponse={handlePlayerResponse}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default ConvoCalcio;
