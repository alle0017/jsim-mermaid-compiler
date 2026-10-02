export class MdNode {
      private readonly next: Set<MdNode> = new Set;
      private readonly prev: Set<MdNode> = new Set;
      public label: string = '';
      constructor(public readonly name:  string) { this.label = name; }

      public addNext(node: MdNode) {
            this.next.add(node);
            node.prev.add(node);
      }

      public getNext() {
            return [...this.next];
      }

      public isSink() {
            return this.next.size == 0;
      }

      public isSource() {
            return this.prev.size == 0;
      }
}
class MdContext {
      private readonly nodes: Map<string, MdNode> = new Map;

      public get(name: string) {
            if (this.nodes.has(name)) {
                  return this.nodes.get(name)!;
            }
            const node = new MdNode(name);
            this.nodes.set(name, node);
            return node;
      }
      public getNodes() {
            return [...this.nodes.values()];
      }
}
export class MermaidCompiler {
      private readonly ctx: MdContext = new MdContext;

      constructor(text: string) {
            const code = text.split('\n').filter(r => r.includes('-->'));


            for (const row of code) {
                  const operands = row.replaceAll(' ', '').split('-->');
                  const op1 = this.parseOperand(operands[0]);
                  const successors = operands[1].split('&');

                  for (const succ of successors) {
                        const op2 = this.parseOperand(succ);
                        op1.addNext(op2);
                  }
            }
      }

      private getLabel(op: string) {
            let label = '';
            let i = 0;
            while (i < op.length && op[i] != '"') {
                  i++;
            }
            i++;
            while (i < op.length && op[i] != '"') {
                  label += op[i];
                  i++;
            }
            return label;
      }
      private parseOperand(op: string) {
            let name = '';
            let label = '';
            for (let i = 0; i < op.length; i++) {
                  if (!new RegExp(/\w/).test(op[i])) {
                        label = this.getLabel(op);
                        break;
                  }
                  name += op[i];
            }
            const node = this.ctx.get(name);
            if (label) {
                  node.label = label;
            }
            return node;
      }
      public getNodes() {
            return this.ctx.getNodes();
      }
}