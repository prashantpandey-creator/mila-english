// @ts-nocheck
'use client';

export default function CategoryFilter({ categories, active, onChange }: {
  categories: string[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <div className="category-filter">
      {categories.map((c,i)=>(
        <button className={`category-filter__button${i===active?' is-active':''}`} key={i} onClick={()=>onChange(i)}>
          {c}
        </button>
      ))}
    </div>
  );
}
