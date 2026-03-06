export default function RoomCard({type,onClick}){

return(

<div className="room-card">

<div className="card-body">

<h3>

{type==="create"
? "Create a Room"
: "Join a Room"}

</h3>

<button
className="card-cta"
onClick={onClick}
>

{type==="create"
? "+ Create Room"
: "→ Join Room"}

</button>

</div>

</div>

)

}