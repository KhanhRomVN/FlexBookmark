export interface BookmarkNode {
    parentId: string;
    id: string;
    title: string;
    url?: string;
    children?: BookmarkNode[];
}
