export interface BookmarkNode {
    parentId?: string; // Make parentId optional
    id: string;
    title: string;
    url?: string;
    children?: BookmarkNode[];
}