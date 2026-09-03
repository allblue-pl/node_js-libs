import ts0, { type TS0RawArray, type TS0RawObject, type TS0RawValue } from "@allblue/ts0";

type Gym_Events_PriceType = {
    Type: string,
    Name: string,
    Price: number,
};

type T_RSys_Boulders = {
    _Id: number|null
    Sector__Id: number|null
    Color__Id: number|null
    Grade__Id: number|null
    Description: string
    Order: number
    Beta__Id: number|null
    Archived: boolean
    Color_Gym__Id: number|null
    Color_Name: string
    Color_BackgroundColor: string
    Color_TextColor: string
    Grade_Gym__Id: number|null
    Grade_Name: string
    Grade_Order: number
    Sector_Gym__Id: number|null
    Sector_Index: number
    Sector_Name: string
    Sector_PrevSectorIndex: number|null
    Sector_NextSectorIndex: number|null
    Gym__Id: number|null
    Gym_Name: string
    Gym_Alias: string
    Beta_Gym__Id: number|null
    Beta_Info: TS0RawValue
};

type T_RSys_Gym_Events = {
    _Id: number|null
    Gym__Id: number
    Name: string
    Date: number
    Data: {
        Groups: Array<{
            DateTime: number,
            MaxParticipants: number,
        }>,
        PriceTypes: Array<{
            Type: string,
            Name: string,
            Price: number,
        }>,
    }
    ParticipantsCount: number
};

