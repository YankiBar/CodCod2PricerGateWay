select
    top 100 ITEMID
from
    (
        select
            ITEMID
        from
            tblpromoitems PI
            inner join tblpromogeneral PG on pg.fldpromonum = PI.fldpromonum
            and pg.BenchmarkDate between '2024-11-18T08:41:43'
            and '2024-11-18T09:41:43.021'
            inner join item on item.BARCODE = fldcode
            and item.PRICEEX1 > 0.01
        union
        select
            ITEMID
        from
            item
        where
            item.PRICEEX1 > 0.01
            and item.ITEMOWNER != 'S'
            and item.NOTFORSALE = 'F'
            and FLDUNITTYPE is not null
            and FLDUNITTYPE != ''
            and item.BenchmarkDate between '2024-11-18T08:41:43'
            and '2024-11-18T09:41:43.021'
    ) t
where
    ITEMID > 0
order by
    ITEMID

    ModifiedBefore

    ModifiedAfter