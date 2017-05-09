/**
 * Created by siven on 2017-05-03.
 */
const sizes = [20,40,80,160];
//const sizes = [20];

function randomizer (arr){
    return ()=>{
        let index = Math.floor(Math.random()*arr.length);
        return arr[index];
    }
}

function randomArray(randomizer, length){
    const array = [];
    for(let i = 0;i<length;i++){
        array.push(randomizer());
    }
    return array;
}

function Project(size,value,id){
    const self = this;
    console.log("Project("+ size+")");
    self.value = value||0;
    self.size = size;
    self.id = id;
    self.remaining = size;
    self.do = throughput => {

        self.remaining -= throughput;
    }

    self.isOngoing = ()=> !self.isDone() && self.remaining < self.size;
    self.isDone = ()=>self.remaining<=0;
    self.getStatus = (iteration)=>{
        if(self.startTime > iteration){
            return "notStarted";
        } else if (self.startTime <= iteration  && self.leadTime > iteration ){
            return "ongoing";
        } else {
            return "done";
        }
    }

    self.wsjf = ()=>{
        return self.value/self.size;
    }

    self.triggerStart = (triggerLevel)=>{

        result =  (self.remaining/self.size)<=triggerLevel; //&& !self.triggered;
        if(result){
            self.triggered = true;
        }
        return result;
    }
    return self;
}

function createProjects (sizes,values){
    const projects = [];
    values = values||[];

    sizes.forEach((size, index)=>{
        projects.push(new Project(size,values[index],index));
    });

    return projects;
}


function getActiveProjectsWip(start,trigger){
    trigger = trigger||0;
    return (projects)=>{
        const activeProjects = [];
        let wip = start;
        projects.forEach(project=>{
            if(project.isOngoing()){
                activeProjects.push(project);
                if(project.triggerStart(trigger)){
                    wip += 1;
                }
            }else if(!project.isDone() & activeProjects.length < wip){
                activeProjects.push(project);
            }
        });
        return activeProjects;

    }
}

function divideCapacityEqualy(capacity, multitaskingFactor){
    let notUsed = 0;
    multitaskingFactor = multitaskingFactor||1;
    return (projects)=>{

        let throughput = (capacity+notUsed)*Math.pow(multitaskingFactor,projects.length-1)/projects.length;
        notUsed = 0;

        projects.forEach(project=>{
            project.do(throughput);
            if(project.remaining <0){
                notUsed= notUsed - project.remaining
            }
        });
    }
}

function divideCapacitybySize(capacity, multitaskingFactor){
    let notUsed = 0;
    multitaskingFactor = multitaskingFactor||1;
    return (projects)=>{
        const totalSize = projects.map(p=> p.size).reduce((next,val)=>next+val);
        let throughput = (capacity+notUsed)*Math.pow(multitaskingFactor,projects.length-1)/totalSize;
        notUsed = 0;

        projects.forEach(project=>{
            project.do(throughput*project.size);
        if(project.remaining <0){
            notUsed= notUsed - project.remaining
        }
    });
    }
}

function divideCapacityRandomly(capacity, multitaskingFactor){
    let notUsed = 0;
    multitaskingFactor = multitaskingFactor||1;
    return (projects)=>{
        let throughput = (capacity+notUsed)*Math.pow(multitaskingFactor,projects.length-1);
        notUsed = 0;
        for(let i=0;i<throughput;i++){
            projects[Math.floor(Math.random()*projects.length)].do(1);
        }
        projects.forEach(project=>{
        if(project.remaining <0){
            notUsed= notUsed - project.remaining
        }
    });
    }
}

function prioritize(projects){
    return projects.sort((a,b)=>b.wsjf()- a.wsjf());
}




function setStatusChangeTimes(projects, iteration){
    projects.forEach(project=>{
        if(project.isDone() & !project.leadTime){
            project.leadTime = iteration;
            console.log("done");
        }

        if((project.isOngoing()|| project.isDone()) & !project.startTime){
            project.startTime = iteration;
            console.log("started");
        };
    })
}

function allDone(projects){
    let done = projects.filter((project)=> project.isDone());

    return done.length===projects.length;
}


function createStream(key,values){
    return {
        "key": key,
        "values":values
    };
}

function getPropertyMapFunc(prop){
    return (status,index)=>{
        return [index,status[prop]];
    }
}

function createCfdDataSet(statuses){
    const data = [];


    data.push(createStream("Done",statuses.map(getPropertyMapFunc("done"))));
    data.push(createStream("Ongoing",statuses.map(getPropertyMapFunc("ongoing"))));
    data.push(createStream("Not started",statuses.map(getPropertyMapFunc("notStarted"))));

    return data;
}

function cfdReport(projects){
    return createCfdDataSet(buildCfdData(projects))
}

function buildCfdData(projects){
    const cfdData =[];
    for(let i = 0; i===0 || cfdData[i-1].done < projects.length; i++){
        cfdData.push(getIterationStatus(projects,i));
    }
    return cfdData;
}

function getIterationStatus(projects,iteration){
    const iterationStatus  = {
        notStarted:0,
        ongoing:0,
        done:0
    };

    projects.forEach(project=>{

        iterationStatus[project.getStatus(iteration)]++;
    });

    return iterationStatus;
}

function leadTimeDiffReport(projects, projects2) {
    return [{
            key: "LeadTimeDiff",
            bar:true,
            values: projects.map((project, index) => {
            return projects2[index].leadTime - project.leadTime;
        }).map((diff, index) => {
            let size = "0"+(projects[index].size/10);
            return [
                 Number("" + index+"."+size.substr(size.length-2,size.length)),
                 diff
            ]
        })
    }]
}


function valueReport(projects,label){
    return createValueDataSet(buildCumulativeValueDeliveredData(projects),label);
}

function createValueDataSet(values, label){
    const data = createStream(label,values.map((value,index)=>{return{x:index,y:value}}));
    data.yAxis = 1;
    data.type = "line";

    return data;
}

function buildCumulativeValueDeliveredData(projects){
    const valueData =[];
    for(let i = 0; i===0 || getIterationStatus(projects,i-1).done < projects.length; i++){
        valueData.push(getDeliveredValue(projects,i));
    }
    return valueData;
}

function getDeliveredValue(projects,iteration){
    let value = 0;

    projects.forEach(project=>{
        const status = project.getStatus(iteration);
        if(status === 'done'){
            value += project.value;
        }
});

    return value;
}


function averageLeadTime(projects){
    let sum = 0;
    projects.forEach(project=>{
        sum+= project.leadTime
    });

    return sum/projects.length;
}






