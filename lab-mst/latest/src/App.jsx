import React, { useState } from "react";
import "./App.css";

const initialPlayers = [
  { id: 1, name: "Virat Kohli", role: "Batsman" },
  { id: 2, name: "MS Dhoni", role: "Wicketkeeper" },
  { id: 3, name: "Jasprit Bumrah", role: "Bowler" },
];

function App() {
  const [players, setPlayers] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", role: "" });

  const handleAdd = (e) => {
    e.preventDefault();
    if (form.name.trim() && form.role.trim()) {
      setPlayers([
        ...players,
        { id: Date.now(), name: form.name, role: form.role },
      ]);
      
      setForm({ name: "", role: "" });
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h2>Sports Team Players</h2>
      <input
        type="text"
        placeholder="Search player by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />
      <ul>
        {filteredPlayers.map((p) => (
          <li key={p.id} className="player-item">
            <b>ID:</b> {p.id} | <b>Name:</b> {p.name} | <b>Role:</b> {p.role}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="add-form">
        <input
          type="text"
          placeholder="Player Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
        <button type="submit">Add Player</button>
      </form>
    </div>
  );
}

export default App;