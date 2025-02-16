// 首先实现Id，用于标识元素
type Id = [string, number]; // [client, clock]
const Id = {
    equals(a: Id, b: Id): boolean {
        return a[0] === b[0] || (a[0] === b[0] && a[1] === b[1]);
    },
    compare(a: Id | null, b: Id | null) {
        return a === b || (a !== null && b !== null && a[0] === b[0] && a[1] === b[1]);
    },
    hash(id: Id): string {
        return `${id[0]}:${id[1]}`;
    },
};

// 实现版本向量类型Vector
type Vector = Record<string, number>;
const Vector = {
  in(id: Id | null, version: Vector) {
    if (id === null) {
      return true;
    }
    const clock = version[id[0]];
    return clock !== null && clock >= id[1];
  },
};

// 实现ItemInfo类型，用于描述元素的状态
export type ItemInfo = {
    id : Id;
    originLeft: Id | null;
    originRight: Id | null; // YATA算法中并未使用，不使用则可能存在不同步问题，在yjs的优化中使用
    parentKey: string | null;
    parentSub: string | null;
    isDeleted: boolean;
    content: string;
};

// 实现Text类型，用于描述文本元素，是Item的容器
export class Text {
    _start: Item | null;
    _map: Map<string, Item | undefined>;
    length: number;
    doc: Doc; // Doc指向所属文档实例
  
    public constructor(doc: Doc) {
      this._start = null;
      this._map = new Map();
      this.length = 0;
      this.doc = doc;
    }

    public get item() {
        return this._start;
    }

    public get items(): Item[] {
        let item = this._start;
        const items: Item[] = [];
        while (item !== null) {
            if (!item.isDeleted) {
                items.push(item);
            }
            item = item.right;
        }
        return items;
    }
  
    public insert(index: number, content: string) {
      const doc = this.doc;
      const clock = doc.vector[doc.clientId] ?? -1;
  
      const left = this.findItem(index - 1);
      const right = left === null ? this._start : left.right;
  
      const item = new Item(
        content,
        [doc.clientId, clock + 1],
        false,
        left?.id ?? null,
        right?.id ?? null,
        left,
        right,
        this,
        null
      );
      this.integrate(item);
    }
  
    public delete(index: number) {
      const item = this.findItem(index);
      if (!item) {
        throw new Error("Item not found");
      }
      this.doc.deleteItem(item.id);
      item.delete();
      this.length -= 1;
    }
  
    public get(index: number) {
      const item = this.findItem(index);
      if (!item) {
        throw new Error("Item not found");
      }
      return item.content;
    }
  
    public integrate(item: Item) {
      // console.log("integrate", item.id);
      const doc = this.doc;
      const lastClock = doc.vector[item.id[0]] ?? -1;
      const clock = item.id[1];
      if (lastClock + 1 !== clock) {
        throw new Error("Clock not match");
      }
      doc.vector[item.id[0]] = clock;
  
      item.integrate(doc);
      if (!item.isDeleted) {
        this.length += 1;
      }
    }

    public toString(): string {
        let item = this._start;
        let content: string = "";
        while (item !== null) {
            if (!item.isDeleted) {
                content += item.content;
            }
            item = item.right;
        }
        return content;
    }
  
    private findItem(index: number): Item | null {
      if (index < 0) {
        return null;
      }
      let j = index;
      let item: Item | null = this.item;
      while (item !== null) {
        if (item.isDeleted) {
          item = item.right;
          continue;
        }
        if (j === 0) return item;
        j--;
        item = item.right;
      }
      if (j > 0) {
        throw new Error("Index out of range");
      }
      return null;
    }
}
  
// Item类型，Yata算法的核心，文档被认为是由一系列Item组成的集合
export class Item {
    content: string; // 单个字符
    id : Id;
    isDeleted: boolean;

    originLeft: Id | null; // 仅在Doc开头时为null
    originRight: Id | null; // 仅在Doc结尾时为null

    left: Item | null;
    right: Item | null;

    parent: Text | null;
    parentSub: string | null;

    public constructor(
        content: string,
        id: Id,
        isDeleted: boolean,
        originLeft: Id | null,
        originRight: Id | null,
        left: Item | null,
        right: Item | null,
        parent: Text | null,
        parentSub: string | null,
    ) {
        this.content = content;
        this.id = id;
        this.isDeleted = isDeleted;
        this.originLeft = originLeft;
        this.originRight = originRight;
        this.left = left;
        this.right = right;
        this.parent = parent;
        this.parentSub = parentSub;
    }

    public getOriginLeft(): Id | null {
        return this.originLeft;
    }

    public getOriginRight(): Id | null {
        return this.originRight;
    }

    public getLeft(): Item | null {
        return this.left;
    }

    public getRight(): Item | null {
        return this.right;
    }

    // 基于YATA算法，协同编辑的核心
    public integrate(doc: Doc) {
      const parent = this.parent;
      const parentSub = this.parentSub;
      const getItem = (id: Id | null) => doc.getItem(id);
      if (
        (!this.left && (!this.right || this.right.left !== null)) ||
        (this.left && this.left.right !== this.right)
      ) {
        let left = this.left; // 插入时的左边节点，即插入origin
  
        let o; // 是否具有冲突的节点
        // set o to the first conflicting item
        if (left !== null) {
          // list, text set left to the first conflicting item
          o = left.right;
        } else if (parentSub !== null) {
          // map sets left to the first item with the same key
          o = parent?._map.get(parentSub) || null;
          while (o !== null && o.left !== null) {
            // map, set o to the first item of key
            o = o.left;
          }
        } else {
          o = parent?._start; // default set o to the first item
        }
  
        const conflictingItems = new Set();
        const itemsBeforeOrigin = new Set();
        // Let c in conflictingItems, b in itemsBeforeOrigin
        // ***{origin}bbbb{this}{c,b}{c,b}{o}***
        // Note that conflictingItems is a subset of itemsBeforeOrigin
        while (o !== null && o !== this.right && o !== undefined) {
          itemsBeforeOrigin.add(o);
          conflictingItems.add(o);
          if (Id.compare(this.originLeft, o.originLeft)) {
            // case 1
            if (o.id[0] < this.id[0]) {
              // 如果o的clientID小于this的clientID，那么o在this的左边，大的在右边
              left = o;
              conflictingItems.clear();
            } else if (Id.compare(this.originRight, o.originRight)) {
              // 右插入意图相同，则直接break
              // this and o are conflicting and point to the same integration points. The id decides which item comes first.
              // Since this is to the left of o, we can break here
              break;
            } // else, o might be integrated before an item that this conflicts with. If so, we will find it in the next iterations
          } else if (
            o.originLeft !== null &&
            itemsBeforeOrigin.has(getItem(o.originLeft))
          ) {
            // use getItem instead of getItemCleanEnd because we don't want / need to split items.
            // case 2
            if (!conflictingItems.has(getItem(o.originLeft))) {
              left = o;
              conflictingItems.clear();
            }
          } else {
            break; // 直接break，会发生意图交叉
          }
          o = o.right;
        }
        this.left = left;
      }
      // reconnect left/right + update parent map/start if necessary
      if (parent === null) throw new Error("Parent not found");
      if (this.left !== null) {
        const right = this.left.right;
        this.right = right;
        this.left.right = this;
      } else {
        let r;
        if (parentSub !== null) {
          r = parent?._map.get(parentSub) || null;
          while (r !== null && r.left !== null) {
            r = r.left;
          }
        } else {
          r = parent._start;
          parent._start = this;
        }
        this.right = r;
      }
      // for map
      if (this.right !== null) {
        this.right.left = this;
      } else if (parentSub !== null) {
        // set as current parent value if right === null and this is parentSub
        parent._map.set(parentSub, this);
        if (this.left !== null) {
          // this is the current attribute value of parent. delete right
          this.left.delete();
        }
      }
      doc.addItem(this);
    }

    public fillMissing(doc: Doc) {
      if (this.originLeft !== null && this.left === null) {
        this.left = doc.getItem(this.originLeft);
      }
      if (this.originRight !== null && this.right === null) {
        this.right = doc.getItem(this.originRight);
      }
    }

    public delete() {
        this.isDeleted = true;
    }

    public getContent(): string {
        return this.content;
    }

    public getInfo(doc: Doc): ItemInfo {
        const parentKey = this.parent ? doc.findKey(this.parent): null;
        return {
            id: this.id,
            originLeft: this.originLeft,
            originRight: this.originRight,
            parentKey,
            parentSub: this.parentSub,
            isDeleted: this.isDeleted,
            content: this.content,
        };
    }

    static fromInfo(o: ItemInfo, doc: Doc): Item {
        let parent = o.parentKey ? doc.getText(o.parentKey) : null;
        if (parent === null) {
            throw new Error("Parent not found");
        }
        return new Item(
            o.content,
            o.id,
            o.isDeleted,
            o.originLeft,
            o.originRight,
            null,
            null,
            parent,
            o.parentSub,
        );
    }
}

const randomString = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength));

  return result;
};

export class Doc {
    share: Map<string, Text>; // 共享文本实例
    vector: Vector; // 版本向量
    clientId: string; // 客户端ID
    store: Map<string, Item[]>; // 通过 clientId 索引的元素集合
    deleted: Set<Id>; // 已删除的元素ID集合

    public constructor(clientId?: string) {
        const cid = clientId ?? randomString(42);
        this.share = new Map();
        this.vector = {};
        this.clientId = cid;
        this.store = new Map();
        this.deleted = new Set();
    }

    public getText(name: string = ""): Text {
        if (!this.share.has(name)) {
            const at = new Text(this);
            this.share.set(name, at);
        }
        return this.share.get(name) as Text;
    }

    public merge(src: Doc) {
        const missing: (ItemInfo | null)[] = src.getMissing(this.getVersion());
        this.applyUpdate(missing, src.deleted);
    }

    public applyUpdate(missing: (ItemInfo | null)[], ds: Set<Id>): void {
        const dest = this;
        let remaining = missing.length;
        while (remaining > 0) {
            for (let i = 0; i < missing.length; i++) {
                const o = missing[i];
                const item = o === null? null : Item.fromInfo(o, dest);
                if (item === null || !this.canInsert(item)) {
                    continue;
                }
                item.fillMissing(this);
                item.parent?.integrate(item);
                missing[i] = null;
                remaining--;
            }
        }
        // 处理删除项
        for (const id of ds) {
            const item = this.getItem(id);
            if (item && !item.isDeleted) {
                item.delete();
                if (item.parent) {
                    item.parent.length -= 1;
                }
            }
        }
    }

    public getVersion() {
        return this.vector;
    }

    public getMissing(to: Vector) {
        const missing: (ItemInfo | null)[] = [...this.store.values()]
            .flat()
            .filter((item) => !Vector.in(item.id, to))
            .map((item) => item.getInfo(this));
        return missing;
    }

    private canInsert(item: Item) {
        const doc = this;
        return (
            !Vector.in(item.id, doc.vector) &&
            (item.id[1] === 0 || // first insert item
              Vector.in([item.id[0], item.id[1] - 1], doc.vector)) && // previous item is in version
            Vector.in(item.getOriginLeft(), doc.vector) &&
            Vector.in(item.getOriginRight(), doc.vector)
          );
    }

    findKey(at: Text) {
        for (const [key, value] of this.share.entries()) {
            if (value === at) {
                return key;
            }
        }
        return null;
    }

    addItem(item: Item) {
      const clientId = item.id[0];
      const list = this.store.get(clientId) ?? [];
      if (list.length > 0 && list[list.length - 1].id[1] + 1 !== item.id[1]) {
        throw new Error("Clock not match");
      }
      list.push(item);
      this.store.set(clientId, list);
    }

    deleteItem(id: Id) {
      this.deleted.add(id);
    }

    getItem(id: Id | null): Item | null {
      if (id === null) {
          return null;
        }
        const items = this.store.get(id[0]);
        if (!items) {
            return null;
        }
        return this.binarySearch(items, id);
    }

    // 分离二分查找，提高代码可复用性
    private binarySearch(items: Item[], id: Id): Item | null {
      let left = 0, right = items.length - 1;
      while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const item = items[mid];
          if (Id.compare(item.id, id)) {
              return item;
          }
          if (item.id[1] < id[1]) {
              left = mid + 1;
          } else {
              right = mid - 1;
          }
      }
      return null;
    }
}