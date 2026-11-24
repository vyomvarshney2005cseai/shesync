class Base { exists = false; uri = ''; constructor(..._a: any[]) {} delete() {} create() {} async move() {} }
export class File extends Base {}
export class Directory extends Base {}
export const Paths = { document: '/doc', cache: '/cache' };
