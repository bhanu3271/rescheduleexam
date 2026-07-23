// ======================================
// INPUT ELEMENTS
// ======================================

const mentorNameInput =
document.getElementById("mentorName");

const learnerNameInput =
document.getElementById("learnerName");

const rollNoInput =
document.getElementById("rollNo");

const programSelect =
document.getElementById("program");

const semesterSelect =
document.getElementById("semester");

const loadSubjectsBtn =
document.getElementById("loadSubjectsBtn");

const subjectsSection =
document.getElementById("subjectsSection");

const subjectsContainer =
document.getElementById("subjectsContainer");

const reviewSection =
document.getElementById("reviewSection");

const scheduleForm =
document.getElementById("scheduleForm");

const submitBtn =
document.getElementById("submitBtn");

const successMsg =
document.getElementById("successMsg");

const successDetail =
document.getElementById("successDetail");


// ======================================
// GOOGLE SCRIPT URL
// ======================================

const GOOGLE_SCRIPT_URL =
"YOUR_GOOGLE_SCRIPT_URL_HERE";



// ======================================
// LOAD PROGRAMS
// ======================================

async function loadPrograms(){

try{

const { data,error } = await supabaseClient

.from("exam_schedule_muj")

.select("program")

.order("program")

.range(0,5000);


if(error) throw error;


const programs=[

...new Set(

data.map(x=>x.program)
.filter(Boolean)

)

];


programSelect.innerHTML =
'<option value="">-- Select Program --</option>';


programs.forEach(program=>{

programSelect.innerHTML += `

<option value="${program}">
${program}
</option>

`;

});


}

catch(error){

console.log(error);

}

}


loadPrograms();



// ======================================
// LOAD SEMESTERS
// ======================================


programSelect.addEventListener(

"change",

async()=>{


const selectedProgram =
programSelect.value;


semesterSelect.innerHTML =
'<option value="">Loading...</option>';


try{


const {data,error} = await supabaseClient

.from("exam_schedule_muj")

.select("semester")

.eq("program",selectedProgram)

.order("semester");


if(error) throw error;


const semesters=[

...new Set(

data.map(x=>x.semester)
.filter(Boolean)

)

];


semesterSelect.innerHTML =

'<option value="">-- Select Semester --</option>';


semesters.forEach(semester=>{

semesterSelect.innerHTML += `

<option value="${semester}">
${semester}
</option>

`;

});


}

catch(error){

console.log(error);

semesterSelect.innerHTML =
'<option value="">Error Loading</option>';

}


}

);



// ======================================
// LOAD SUBJECTS
// ======================================


async function loadSubjects(){


const selectedProgram =
programSelect.value;


const selectedSemester =
semesterSelect.value;


if(!selectedProgram || !selectedSemester){

alert("Please select Program and Semester.");

return;

}


subjectsContainer.innerHTML =
"<p>Loading Course Codes...</p>";


try{


const {data,error} = await supabaseClient

.from("exam_schedule_muj")

.select("*")

.eq("program",selectedProgram)

.eq("semester",selectedSemester);


if(error) throw error;


subjectsContainer.innerHTML = "";


const groupedSubjects = {};


data.forEach(subject=>{


const code = subject.coursecode;


if(!groupedSubjects[code]){


groupedSubjects[code] = {

coursecode : subject.coursecode,

coursename : subject.coursename,

slots : []

};

}


groupedSubjects[code].slots.push({

examdate : subject.examdate,

examtime : subject.examtime,

seatsleft : subject.seatsleft

});


});



const today = new Date();



Object.values(groupedSubjects)

.forEach((subject,index)=>{


let slotOptions = "";


subject.slots.forEach(slot=>{


const examDate =
new Date(slot.examdate);


const cutoffDate =
new Date(examDate);


cutoffDate.setDate(

cutoffDate.getDate()-2

);


cutoffDate.setHours(

0,0,0,0

);


// 48 HOUR RULE

if(today >= cutoffDate){

return;

}


slotOptions += `

<option value="${slot.examdate}|${slot.examtime}|${slot.seatsleft}">

${slot.examdate} | ${slot.examtime} | Seats Left : ${slot.seatsleft}

</option>

`;


});


if(slotOptions===""){

return;

}


subjectsContainer.innerHTML += `


<div class="subject-card">


<div class="sub-header">


<div class="sub-index">

${index+1}

</div>


<div class="sub-info">


<div class="sub-code">

${subject.coursecode}

</div>


<div class="course-name">

${subject.coursename}

</div>


</div>


</div>



<div class="sub-inputs">


<div class="sub-field">


<label>

Select Exam Slot

</label>



<select

class="exam-slot"

data-code="${subject.coursecode}"

data-name="${subject.coursename}"

>


<option value="">

Select Exam Slot

</option>


${slotOptions}


</select>


</div>


</div>


</div>

`;



});


subjectsSection.classList.remove("hidden");

reviewSection.classList.remove("hidden");


}


catch(error){

console.log(error);

alert("Unable to load Course Codes.");

}


}


loadSubjectsBtn.addEventListener(
"click",
loadSubjects
);
// ======================================
// COLLECT FORM DATA
// ======================================


function collectFormData(){


const examSlots =

document.querySelectorAll(".exam-slot");


const rows=[];


examSlots.forEach(slot=>{


if(!slot.value) return;


const values =
slot.value.split("|");


rows.push({


mentor_name :
mentorNameInput.value.trim(),

learner_name :
learnerNameInput.value.trim(),

roll_no :
rollNoInput.value.trim(),

program :
programSelect.value,

semester :
semesterSelect.value,

coursecode :
slot.dataset.code,

coursename :
slot.dataset.name,

examdate :
values[0].trim(),

examtime :
values[1].trim(),

seatsleft :
values[2].replace("Seats Left :","").trim()


});


});


return rows;


}




// ======================================
// SUBMIT FORM
// ======================================


scheduleForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();


// Mentor Name Mandatory


if(mentorNameInput.value.trim()===""){

alert("Please enter Mentor Name.");

mentorNameInput.focus();

return;

}


// Roll Number Mandatory


if(rollNoInput.value.trim()===""){

alert("Please enter Roll Number.");

rollNoInput.focus();

return;

}


// Program Mandatory


if(programSelect.value===""){

alert("Please select Program.");

return;

}


// Semester Mandatory


if(semesterSelect.value===""){

alert("Please select Semester.");

return;

}



// Collect Selected Subjects


const rows = collectFormData();



// At least one subject must be selected


if(rows.length===0){

alert("Please select at least one exam slot.");

return;

}



submitBtn.disabled = true;


submitBtn.innerHTML =

'<i class="fas fa-spinner fa-spin"></i> Submitting...';



try{


await fetch(

GOOGLE_SCRIPT_URL,

{

method : "POST",

mode : "no-cors",

headers : {

"Content-Type":"application/json"

},

body : JSON.stringify(rows)

}

);



// SUCCESS MESSAGE


successMsg.classList.remove("hidden");


successDetail.textContent =

"Your Reschedule Request has been submitted successfully.";



// RESET FORM


scheduleForm.reset();


subjectsContainer.innerHTML = "";


subjectsSection.classList.add("hidden");

reviewSection.classList.add("hidden");



loadPrograms();



successMsg.scrollIntoView({

behavior : "smooth"

});


}


catch(error){


console.log(error);


alert(

"Error while submitting the request."

);


}


finally{


submitBtn.disabled = false;


submitBtn.innerHTML =

'<i class="fas fa-paper-plane"></i> Submit Request';


}


}

);
