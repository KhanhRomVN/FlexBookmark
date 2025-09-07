export interface BookmarkNode {
    parentId?: string;
    id: string;
    title: string;
    url?: string;
    children?: BookmarkNode[];
}

export interface WeatherData {
    temperature: number;
    weathercode: number;
    description: string;
}