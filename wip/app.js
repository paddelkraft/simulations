var app = angular.module('simulation', ['nvd3','ui.bootstrap']);

app.controller('MainCtrl', function($scope) {
    $scope.simulation1Params={
        label: "Simulation1",
        wip:2,
        prioritize:false,
        triggerLevel: 0,
        capacity:40
    };
    $scope.simulation2Params={
        label: "Simulation2",
            wip:8,
            prioritize:false,
            triggerLevel: 0,
            capacity:40
    };
    $scope.numberOfProjects = 50;
    $scope.multiTaskingCost = 0;
    $scope.projectSizes=[];
    $scope.capacity = 40;
    $scope.triggerLevel = 25;
    $scope.showLeadTimeGraph=true;

    $scope.capacityAllocationOptions = [{
            label:"Divide Equally",
            func:divideCapacityEqualy
         }, {
            label:"Divide by Size",
            func:divideCapacitybySize
        },
        {
            label:"Randomly",
            func:divideCapacityRandomly
        }
    ];
    $scope.capacityAllocation = $scope.capacityAllocationOptions[0];

    $scope.options = {
            chart: {
                type: 'stackedAreaChart',
                height: 200,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 30,
                    left: 40
                },
                x: function(d){return d[0];},
                y: function(d){return d[1];},
                useVoronoi: false,
                clipEdge: true,
                duration: 100,
                useInteractiveGuideline: true,
                xAxis: {
                    showMaxMin: false,
                    tickFormat: function(d) {
                        return d3.format(',.0f')(d)
                    }
                },
                yAxis: {
                    tickFormat: function(d){
                        return d3.format(',.0f')(d);
                    }
                },
                zoom: {
                    enabled: true,
                    scaleExtent: [1, 10],
                    useFixedDomain: false,
                    useNiceScale: false,
                    horizontalOff: false,
                    verticalOff: true,
                    unzoomEventType: 'dblclick.zoom'
                }
            }
        };
    $scope.optionsDBC = {
        chart: {
            type: 'historicalBarChart',
            height: 200,
            margin : {
                top: 20,
                right: 20,
                bottom: 65,
                left: 50
            },
            x: function(d){return d[0];},
            y: function(d){return d[1];},
            showValues: true,
            valueFormat: function(d){
                return d3.format(',.0f')(d);
            },
            duration: 100,
            xAxis: {
                axisLabel: 'X Axis',
                tickFormat: function(d) {
                    return d3.format(',.0f')(d)
                },
                rotateLabels: 30,
                showMaxMin: false
            },
            yAxis: {
                axisLabel: 'Y Axis',
                axisLabelDistance: -10,
                tickFormat: function(d){
                    return d3.format(',.0f')(d);
                }
            },
            tooltip: {
                keyFormatter: function(d) {
                    return d3.format(',.2f')(d);
                }
            },
            zoom: {
                enabled: true,
                scaleExtent: [1, 10],
                useFixedDomain: false,
                useNiceScale: false,
                horizontalOff: false,
                verticalOff: true,
                unzoomEventType: 'dblclick.zoom'
            }
        }
    };

    $scope.optionsMulti = {
        chart: {
            type: 'multiChart',
            height: 200,
            margin : {
                top: 30,
                right: 60,
                bottom: 50,
                left: 70
            },
            color: d3.scale.category10().range(),
            useInteractiveGuideline: true,
            duration: 500,
            xAxis: {
                tickFormat: function(d){
                    return d3.format(',f')(d);
                }
            },
            yAxis1: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                }
            },
            yAxis2: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                }
            }
        }
    };

    $scope.config = {
        refreshDataOnly: false, // default: true
    };

    function runSimulation(params){
        const projects = simulate(params);
        const data = {
            projects: projects,
            cfdData: cfdReport(projects),
            valueReport: valueReport(projects,params.label),
            averageLeadTime : averageLeadTime(projects),

        }
        return data;
    }

    function simulate( params){
        let projects = createProjects($scope.projectSizes,$scope.projectValues);
        if(params.prioritize){
            projects = prioritize(projects);
        }
        const getActiveProjects = getActiveProjectsWip(params.wip||2, params.triggerLevel/100||0);
        const consumeCapacity = $scope.capacityAllocation.func(params.capacity||10, (100-$scope.multiTaskingCost)/100);

        for(let iteration = 0; !allDone(projects)  ;iteration++){
            consumeCapacity(getActiveProjects(projects));
            setStatusChangeTimes(projects,iteration);
        }

        return projects;
    }

    $scope.triggerSimulations = function(){

        $scope.data = runSimulation($scope.simulation1Params);
        $scope.data2 = runSimulation($scope.simulation2Params);
        $scope.leadTimeDiff = leadTimeDiffReport($scope.data.projects,$scope.data2.projects);
        $scope.valueDelivered = [$scope.data.valueReport,$scope.data2.valueReport];

    };

    $scope.generateProjects = function(){
        $scope.projectSizes = randomArray(randomizer(sizes),$scope.numberOfProjects);
        $scope.projectValues = randomArray(randomizer(sizes),$scope.numberOfProjects);
        $scope.triggerSimulations();
    }

    $scope.generateProjects();
});
