export class ApiBaseType {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(props: any) {
    if (props) {
      Object.assign(this, props);

      if (props.createdAt) this.createdAt = new Date(props.createdAt);
      if (props.updatedAt) this.updatedAt = new Date(props.updatedAt);
    }
  }
}
