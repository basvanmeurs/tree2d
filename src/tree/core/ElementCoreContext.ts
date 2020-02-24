export default class ElementCoreContext {
    public alpha: number = 1;
    public px: number = 0;
    public py: number = 0;
    public ta: number = 1;
    public tb: number = 0;
    public tc: number = 0;
    public td: number = 1;

    isIdentity() {
        return (
            this.alpha === 1 &&
            this.px === 0 &&
            this.py === 0 &&
            this.ta === 1 &&
            this.tb === 0 &&
            this.tc === 0 &&
            this.td === 1
        );
    }

    isSquare() {
        return this.tb === 0 && this.tc === 0;
    }

    static IDENTITY = new ElementCoreContext();
}
