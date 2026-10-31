/* Standalone GitHub Pages demo. All records are fictional and local to this browser. */
(() => {
  const key = 'crewlink-pages-demo-v1';
  let identity = null;
  const customers = [
    {customer_id:1,first_name:'Taylor',last_name:'Morgan',email:'taylor@example.com',phone:'704-555-0101',street:'123 Example Street',city:'Charlotte',state:'NC',zip_code:'28202'},
    {customer_id:2,first_name:'Jordan',last_name:'Rivera',email:'jordan@example.com',phone:'704-555-0102',street:'456 Sample Avenue',city:'Charlotte',state:'NC',zip_code:'28205'},
    {customer_id:3,first_name:'Casey',last_name:'Lee',email:'casey@example.com',phone:'704-555-0103',street:'789 Demo Lane',city:'Concord',state:'NC',zip_code:'28025'},
  ];
  const services = [
    {service_id:1,name:'House Cleaning',description:'Routine home cleaning'},
    {service_id:2,name:'Move-out Cleaning',description:'Detailed cleaning between residents'},
    {service_id:3,name:'HVAC Maintenance',description:'Seasonal system maintenance'},
  ];
  function time(days,hour) {const d=new Date();d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return d.toISOString();}
  function seed() {
    return customers.map((c,i)=>({job_id:i+1,customer_id:c.customer_id,service_id:i+1,
      title:['Weekly home cleaning','Move-out house cleaning','Seasonal HVAC check'][i],
      description:['Clean kitchen, bathrooms, and common areas.','Deep clean before the next resident arrives.','Inspect filters and check system operation.'][i],
      service_street:c.street,service_city:c.city,service_state:c.state,service_zip_code:c.zip_code,
      scheduled_at:time(i+1,9+i*2),status:['scheduled','in_progress','completed'][i],
      instructions:['Use the side entrance.','Focus on the kitchen and baseboards.','Call the customer before arrival.'][i],
      demo_assigned:i!==1}));
  }
  let jobs;
  try {jobs=JSON.parse(localStorage.getItem(key));} catch {jobs=null;}
  if (!Array.isArray(jobs) || jobs.some(j=>!Number.isSafeInteger(j.job_id)||typeof j.title!=='string'||typeof j.status!=='string')) jobs=seed();
  function persist() {try{localStorage.setItem(key,JSON.stringify(jobs));}catch {throw new Error('Browser storage is unavailable or full. Enable site storage to save demo changes.');}}
  const visible=()=>identity?.role==='owner'?jobs:jobs.filter(j=>j.demo_assigned);
  const owner=()=>{if(identity?.role!=='owner')throw new Error('Only the demo owner can do that.');};
  window.crewLinkDemo={
    reset(){jobs=seed();persist();},
    async api(path,options={}) {
      const method=options.method||'GET';const body=options.body?JSON.parse(options.body):{};
      if(path==='/auth/login'){
        identity=body.role==='employee'?{role:'technician',email:'employee@demo.example'}:{role:'owner',email:'owner@demo.example'};
        return {user:identity};
      }
      if(path==='/auth/logout'){identity=null;return;}
      if(!identity)throw new Error('Choose a demo role.');
      if(path==='/auth/me')return {user:identity};
      if(path==='/customers'){owner();return structuredClone(customers);}
      if(path==='/services'){owner();return structuredClone(services);}
      if(path==='/jobs' && method==='GET')return structuredClone(visible().slice().sort((a,b)=>b.job_id-a.job_id));
      if(path==='/jobs' && method==='POST'){
        owner();
        const required=['title','description','service_street','service_city','service_state','service_zip_code'];
        if(required.some(f=>typeof body[f]!=='string'||!body[f].trim())||!customers.some(c=>c.customer_id===body.customer_id)||!services.some(s=>s.service_id===body.service_id)||!Number.isFinite(Date.parse(body.scheduled_at)))throw new Error('Complete all required fields and choose a customer and service.');
        const job={...body,job_id:Math.max(0,...jobs.map(j=>j.job_id))+1,status:'scheduled',demo_assigned:false};
        jobs.unshift(job);try{persist();}catch(error){jobs.shift();throw error;}return structuredClone(job);
      }
      const match=/^\/jobs\/(\d+)$/.exec(path);
      if(match && method==='PATCH'){
        const job=visible().find(j=>j.job_id===Number(match[1]));
        if(!job)throw new Error('Job not found.');
        if(!['in_progress','completed'].includes(body.status))throw new Error('Choose a valid progress status.');
        const previous=job.status;job.status=body.status;try{persist();}catch(error){job.status=previous;throw error;}return structuredClone(job);
      }
      throw new Error('This action is not included in the visual demo.');
    }
  };
})();
