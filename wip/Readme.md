### Wip simulation.

A simple simulation developed to show the importance of working with prioritisation and limiting work in progress.

The simulation runs a list of projects through 2 different scenarios and compares the outcomes

Projects sizes and values are generated randomly from [20,40,80,160].

##### Global Params

Projects = the number of projects in the simulation

Multitasking Cost = the efficency loss in % that a WIP of n+1 results in

Capacity allocation

    Equal    = all ongoing projects get the same capacity
    By Size  = all ongoing projects get capacity allocated based on it size


##### Scenario Params

Capacity = the throughput of the organisation for one iteration
WIP = The amount of projects run in parallel when simulation starts
Trigger level = The percentage of remaining work a project that triggers the start of a new project.
Prioritise = Order projects so that the highest value is delivered first.


### Graphs

**CFD** = Shows a cfd for the two scenarios

**Lead time diff** = compares the time that projects are closed in the two scenarios. The blue bars  indicates
 `delivery in scenario 2 - delivery in scenario 1` so a bar poining upwards says that scenario 1 delivered the
  project first. The size of the projects can be read out from howering the bar. Where the decimal in the index
  is representing the size `10.16` indicates project 10 has a size of 160 and `1.02` indicates project 1 has the
  size of 20. This graph does not make sense when comaring delivery times between prioritised and non prioritised
  scenario.

**Value Delivered ** = shows the difference in value delivered over time between the two scenarios.


