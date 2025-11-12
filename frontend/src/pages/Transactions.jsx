import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function Transactions(){
  const [tx, setTx] = useState([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ type:'expense', amount:'',category:'', description:'' });
  const { user } = useContext(AuthContext);

  async function load() {
    try {
      const r =await api.get('/transactions?page='+ page);
      setTx(r.data.data || []);
    } catch (e) {
      console.warn('load tx err',e && e.message);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function add(e) {
    e.preventDefault();
    try {
      await api.post('/transactions', form);
      setForm({type:'expense', amount:'', category:'', description:'' });
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not add');
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this?')) return;
    try {
      await api.delete('/transactions/' + id);
      load();
    } catch (e) {
      alert('Delete failed');
    }
  }

  return (
    <div>
      <div className="header">
        <h2>Transactions</h2>
        <div style= {{fontSize:14}}>{user?.name} ({user?.role})</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:16, padding:16}}>
        <div className="card">
          <h3>Add Transaction</h3>
          <form onSubmit={add}>
            <div className="form-row">
              <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                <option value ="expense">Expense</option>
                <option value= "income">Income</option>
              </select>
              <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
            </div>

            <div className="form-row">
              <input placeholder ="Category" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
              <input placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            </div>

            <div>
              <button className="btn" type="submit" disabled={user?.role === 'read-only'}>Add</button>
              {user?.role ==='read-only' && <div className="error" style={{marginTop:8}}>Read-only users cannot add or delete</div>}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Transaction List</h3>
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Amount</th><th>Category</th><th>Desc</th><th>Action</th></tr>
            </thead>
            <tbody>
              {tx.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleString()}</td>
                  <td>{t.type}</td>
                  <td>{t.amount}</td>
                  <td>{t.category}</td>
                  <td>{t.description}</td>
                  <td>
                    <button className="btn" onClick={()=>remove(t.id)} disabled={user?.role === 'read-only'}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{textAlign:'center', marginTop:12}}>
            <button className="btn" onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
            <span style={{margin:'0 10px'}}>Page {page}</span>
            <button className="btn" onClick={() => setPage(p => p+1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
