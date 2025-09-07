export interface BookmarkNode {
    parentId: string;
    id: string;
    title: string;
    url?: string;
    children?: BookmarkNode[];
}

export interface FolderModel {
    id: string;
    title: string;
    parentId?: string;
    bookmarks: BookmarkNode[];
}