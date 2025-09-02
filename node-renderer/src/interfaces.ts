// Basic interfaces for the renderer application

export interface NPAuthor {
    name: string,
    address: string
}

export interface NPRenderObject {
    name: string
    post_type: string
    template: NPTemplate
    publication_name: string
    domain: NPDomain
    body_cid: string
}

export interface NPTask {
    slug: string
    author: NPAuthor
    payload: string
    post_type: string
    publication: NPPublication
    items: NPRenderObject[]
    hash: string
}

export interface NPDomain {
    url: string
}

export interface NPCollection {
    source: string
    key: string
    value: string
    query: string
    slug: string
}

export interface NPRipple {
    query: string
    value: string
    post_type: string
}

export interface NPTemplate {
    reference: string
    file: string
    path: string
    collections: NPCollection[]
    ripples: NPRipple[]
}

export interface NPDatabase {
  
}

export interface NTable {
    gateway: string
    id: string
}

export interface NPPublication {
    assets: string
    assets_gateway: string
    contract: string
    data_gateway: string
    domains: NPDomain[]
    mapping: NPTemplate[]
    name: string
    owners: string[]
    rpc: string
    stylesheets: string
    table: NTable
    template_cid: string
    templates: string
}


export interface NPTemplateData {
    // [key: string]: any;
}

export interface PublishEvent {
    author: string;
    publication: string;
    stream_id: string;
}

export type PublishEventCallback = (event: PublishEvent) => void;
