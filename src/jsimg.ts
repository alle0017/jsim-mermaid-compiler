const FILE_NAME = 'model.jsimg';

abstract class JsimNode {
      abstract readonly tagName: string;
      private readonly children: JsimNode[] = [];
      private readonly attributes: Map<string, string> = new Map;

      public append(child: JsimNode) {
            this.children.push(child);
      }

      public querySelector(selector: string): JsimNode | undefined {
            for (let i = 0; i < this.children.length; i++) {
                  if (this.children[i].tagName == selector) {
                        return this.children[i];
                  }
            }
            for (let i = 0; i < this.children.length; i++) {
                  const child = this.children[i].querySelector(selector);
                  if (child) {
                        return child;
                  }
            }
            return undefined;
      }

      public querySelectorAll(selector: string) {
            const result: JsimNode[] = []
            for (let i = 0; i < this.children.length; i++) {
                  if (this.children[i].tagName == selector) {
                        result.push(this.children[i]);
                  }
            }
            for (let i = 0; i < this.children.length; i++) {
                  const child = this.children[i].querySelectorAll(selector);
                  result.push(...child);
            }
            return result;
      }

      public setAttribute(k: string, v: string) {
            this.attributes.set(k,v);
      }
      public getAttribute(k: string) {
            return this.attributes.get(k);
      }
      public toString(): string {
            const tag = `${this.tagName} ${[...this.attributes.entries()].map(([k, v]) => `${k}="${v}"`).join(' ')}`;
            if (this.children.length <= 0) {
                  return `<${tag}/>`
            } 
            return `<${tag}>${this.children.map(c => c.toString()).join('\n')}</${this.tagName}>`
      }
}

abstract class JsimLeaf extends JsimNode {
      tagName: string = '';

      public override append(child: JsimNode): void {
            throw new Error('cannot append on leaf node')
      }
      public abstract override toString(): string;
}
class Document extends JsimNode {
      public readonly tagName: string = 'archive';

      constructor() {
            super();
            this.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            this.setAttribute('name', FILE_NAME);
            const d = new Date();
            const s = d.toString();
            const [wd, mon, day, year, time] = s.split(" ");
            this.setAttribute('timestamp', `${wd} ${mon} ${day} ${time} CEST ${year}`);
            this.setAttribute('xsi:noNamespaceSchemaLocation', 'Archive.xsd');

      }
      public override toString(): string {
          return '<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>' + super.toString();
      }
}

class Sim extends JsimNode {
      public readonly tagName: string = 'sim';

      constructor() {
            super();
            this.setAttribute('disableStatisticStop', 'false');
            this.setAttribute('logDecimalSeparator', ',');
            this.setAttribute('logDelimiter', ';');
            this.setAttribute('logReplaceMode', '0');
            this.setAttribute('maxEvents', '-1');
            this.setAttribute('maxSamples', '1000000');
            this.setAttribute('name', FILE_NAME);
            this.setAttribute('xsi:noNamespaceSchemaLocation', 'SIMmodeldefinition.xsd');
            this.setAttribute('polling', '1.0');
      }
}

class JModel extends JsimNode {
      public readonly tagName: string = 'jmodel';
      constructor() {
            super();
            this.setAttribute('xsi:noNamespaceSchemaLocation', 'JModelGUI.xsd');
      }
}

class Station extends JsimLeaf {
      x = 0;
      y = 0;
      name: string = crypto.randomUUID()
      public toString(): string {
            return `<station name="${this.name}"><position angle="0.0" rotate="false" x="${this.x}" y="${this.y}"/></station>`
      }
}

abstract class SimulationNode extends JsimLeaf {
      public name: string = crypto.randomUUID();
}
class QueueNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <classSoftDeadlines/>
                        <quantumSize>
                        <quantaSize>0.0</quantaSize>
                        </quantumSize>
                        <quantumSwitchoverTime>
                        <quantumSwitchoverTime>0.0</quantumSwitchoverTime>
                        </quantumSwitchoverTime>
                        <section className="Queue">
                        <parameter classPath="java.lang.Integer" name="size">
                              <value>-1</value>
                        </parameter>
                        <parameter array="true" classPath="java.lang.String" name="dropStrategies"/>
                        <parameter classPath="jmt.engine.NetStrategies.QueueGetStrategies.FCFSstrategy" name="FCFSstrategy"/>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.QueuePutStrategy" name="QueuePutStrategy"/>
                        </section>
                        <section className="Server">
                        <parameter classPath="java.lang.Integer" name="maxJobs">
                              <value>1</value>
                        </parameter>
                        <parameter array="true" classPath="java.lang.Integer" name="numberOfVisits"/>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.ServiceStrategy" name="ServiceStrategy"/>
                        <parameter classPath="java.util.HashMap" map="true" name="advancedFeatures">
                              <subParameter array="true" classPath="java.lang.Integer" name="classParallelism"/>
                              <subParameter array="true" classPath="java.lang.String" name="serverNames">
                                    <subParameter classPath="java.lang.String" name="serverTypesNames">
                                    <value>${this.name} - Server Type 1</value>
                                    </subParameter>
                              </subParameter>
                              <subParameter array="true" classPath="java.lang.Integer" name="serversPerServerType">
                                    <subParameter classPath="java.lang.Integer" name="serverTypesNumOfServers">
                                    <value>1</value>
                                    </subParameter>
                              </subParameter>
                              <subParameter array="true" classPath="java.lang.Object" name="serverCompatibilities">
                                    <subParameter array="true" classPath="java.lang.Boolean" name="serverTypesCompatibilities"/>
                              </subParameter>
                              <subParameter classPath="java.lang.String" name="schedulingPolicy">
                                    <value>ALIS (Assign Longest Idle Server)</value>
                              </subParameter>
                              <subParameter classPath="jmt.engine.NetStrategies.VacationStrategies.NoVacationStrategy" name="vacationStrategy"/>
                        </parameter>
                        </section>
                        <section className="Router">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.RoutingStrategy" name="RoutingStrategy"/>
                        </section>
                  </node>
            `
      }
}

class SourceNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <section className="RandomSource">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.ServiceStrategy" name="ServiceStrategy"/>
                        </section>
                        <section className="ServiceTunnel"/>
                        <section className="Router">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.RoutingStrategy" name="RoutingStrategy"/>
                        </section>
                  </node>
            `
      }
}
class SinkNode extends SimulationNode {
      public toString(): string {
            return `
                   <node name="${this.name}">
                        <section className="JobSink"/>
                  </node>
            `
      }
}
class DelayNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <classSoftDeadlines/>
                        <section className="Queue">
                        <parameter classPath="java.lang.Integer" name="size">
                              <value>-1</value>
                        </parameter>
                        <parameter array="true" classPath="java.lang.String" name="dropStrategies"/>
                        <parameter classPath="jmt.engine.NetStrategies.QueueGetStrategies.FCFSstrategy" name="FCFSstrategy"/>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.QueuePutStrategy" name="QueuePutStrategy"/>
                        </section>
                        <section className="Delay">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.ServiceStrategy" name="ServiceStrategy"/>
                        </section>
                        <section className="Router">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.RoutingStrategy" name="RoutingStrategy"/>
                        </section>
                  </node>
            `
      }
}

class RouterNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <section className="Queue">
                        <parameter classPath="java.lang.Integer" name="size">
                              <value>-1</value>
                        </parameter>
                        <parameter array="true" classPath="java.lang.String" name="dropStrategies"/>
                        <parameter classPath="jmt.engine.NetStrategies.QueueGetStrategies.FCFSstrategy" name="FCFSstrategy"/>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.QueuePutStrategy" name="QueuePutStrategy"/>
                        </section>
                        <section className="ServiceTunnel"/>
                        <section className="Router">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.RoutingStrategy" name="RoutingStrategy"/>
                        </section>
                  </node>
            `
      }
}
class ForkNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <section className="Queue">
                        <parameter classPath="java.lang.Integer" name="size">
                              <value>-1</value>
                        </parameter>
                        <parameter array="true" classPath="java.lang.String" name="dropStrategies"/>
                        <parameter classPath="jmt.engine.NetStrategies.QueueGetStrategies.FCFSstrategy" name="FCFSstrategy"/>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.QueuePutStrategy" name="QueuePutStrategy"/>
                        </section>
                        <section className="ServiceTunnel"/>
                        <section className="Fork">
                        <parameter classPath="java.lang.Integer" name="jobsPerLink">
                              <value>1</value>
                        </parameter>
                        <parameter classPath="java.lang.Integer" name="block">
                              <value>-1</value>
                        </parameter>
                        <parameter classPath="java.lang.Boolean" name="isSimplifiedFork">
                              <value>true</value>
                        </parameter>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.ForkStrategy" name="ForkStrategy"/>
                        </section>
                  </node>
            `
      }
}
class JoinNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <section className="Join">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.JoinStrategy" name="JoinStrategy"/>
                        </section>
                        <section className="ServiceTunnel"/>
                        <section className="Router">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.RoutingStrategy" name="RoutingStrategy"/>
                        </section>
                  </node>
            `
      }
}
class SemaphoreNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <section className="Semaphore">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.SemaphoreStrategy" name="SemaphoreStrategy"/>
                        </section>
                        <section className="ServiceTunnel"/>
                        <section className="Router">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.RoutingStrategy" name="RoutingStrategy"/>
                        </section>
                  </node>
            `
      }
}
class ScalerNode extends SimulationNode {
      public toString(): string {
            return `
                  <node name="${this.name}">
                        <section className="Join">
                        <parameter array="true" classPath="jmt.engine.NetStrategies.JoinStrategy" name="JoinStrategy"/>
                        </section>
                        <section className="ServiceTunnel"/>
                        <section className="Fork">
                        <parameter classPath="java.lang.Integer" name="jobsPerLink">
                              <value>1</value>
                        </parameter>
                        <parameter classPath="java.lang.Integer" name="block">
                              <value>-1</value>
                        </parameter>
                        <parameter classPath="java.lang.Boolean" name="isSimplifiedFork">
                              <value>true</value>
                        </parameter>
                        <parameter array="true" classPath="jmt.engine.NetStrategies.ForkStrategy" name="ForkStrategy"/>
                        </section>
                  </node>
            `
      }
}

class ArrowModel extends JsimLeaf {
      constructor(public start: string, public end: string) { super() }
      public toString(): string {
            return `<connection source="${this.start}" target="${this.end}"/>`
      }
}
class ArrowGui extends JsimLeaf {
      constructor(public start: string, public end: string) { super() }
      public toString(): string {
            return ``
      }
}

export abstract class Node {
      name: string = crypto.randomUUID();
      x: number = 0;
      y: number = 0;
      station: Station = new Station;
      abstract model: SimulationNode;

      public append(node: JsimNode) {
            this.station.name = this.name;
            this.station.x = this.x;
            this.station.y = this.y;
            node.querySelector('sim')?.append(this.model);     
            node.querySelector('jmodel')?.append(this.station);
      }
      public setName(name: string) {
            this.station.name = name;
            this.model.name = name;
            this.name = name;
            return this;
      }
}
export class Arrow {
      constructor(public readonly start: string, public readonly end: string) {}
      public append(node: JsimNode) {
            node.querySelector('sim')?.append(new ArrowModel(this.start, this.end));     
            node.querySelector('jmodel')?.append(new ArrowGui(this.start, this.end));
      }
}

export class Delay extends Node {
      model: SimulationNode = new DelayNode;
}

export class Queue extends Node {
      model: SimulationNode = new QueueNode;
}
export class Source extends Node {
      model: SimulationNode = new SourceNode;
}
export class Sink extends Node {
      model: SimulationNode = new SinkNode;
}
export class Scaler extends Node {
      model: SimulationNode = new ScalerNode;
}
export class Fork extends Node {
      model: SimulationNode = new ForkNode;
}
export class Join extends Node {
      model: SimulationNode = new JoinNode;
}
export class Semaphore extends Node {
      model: SimulationNode = new SemaphoreNode;
}
export class Router extends Node {
      model: SimulationNode = new RouterNode;
}
export class JsimContext {
      public readonly document: Document;
      constructor() {
            const doc = new Document;
            doc.append(new Sim)
            doc.append(new JModel)
            this.document = doc;
      }
}