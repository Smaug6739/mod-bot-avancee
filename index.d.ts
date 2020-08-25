import Eris from "eris";

export = delta;
declare const delta: Delta;
declare class Delta {
    constructor(config: object);
    logger: {
        system: object;
        load: object;
        guilds: object;
        signale: object;
    };
    client: object;
    dblClient: object;
    emotes: object;
    constants: {
        colors: {
            green: number;
            red: number;
            main: number;
        };
        badWords: string[];
    };
    owner: object;
    utils: import("./src/Utils");
    commands: Eris.Collection;
    messageHandler: import("./src/MessageHandler");
    prefix: any;
    db: {
        Blacklist: any;
        Guild: any;
        DBLUser: any;
    };
    mutedUsers: Eris.Collection;
    _registerCommands(): Promise<void>;
    _catchErrors(): void;
    _connectDatabase(): Promise<void>;
    _registerEvents(): Promise<void>;
    _connectDBLSystem(): Promise<void>;
}
