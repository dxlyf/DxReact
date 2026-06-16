

export interface NodeProps {
    id: string
}
export abstract class Node<Props extends NodeProps>{
    declare props: Props
    constructor(props: Props) {
        this.props = props
    }
}