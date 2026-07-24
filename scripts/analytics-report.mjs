import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const requestedDays = Number(process.argv[2] || 30)
const days = Number.isInteger(requestedDays) && requestedDays >= 1 && requestedDays <= 366
  ? requestedDays
  : 30
const since = new Date()
since.setUTCDate(since.getUTCDate() - (days - 1))
const sinceDay = since.toISOString().slice(0, 10)

try {
  const rows = await prisma.visitorDay.findMany({
    where: { day: { gte: sinceDay } },
    select: {
      day: true,
      site: true,
      visitorHash: true,
      path: true,
      views: true,
    },
    orderBy: [{ day: 'asc' }, { site: 'asc' }],
  })

  const visitors = new Set()
  const pageViewsByPath = new Map()
  const daily = new Map()
  let pageViews = 0

  for (const row of rows) {
    const visitorKey = `${row.site}:${row.visitorHash}`
    visitors.add(visitorKey)
    pageViews += row.views
    const pathKey = `${row.site}${row.path}`
    pageViewsByPath.set(pathKey, (pageViewsByPath.get(pathKey) || 0) + row.views)
    const day = daily.get(row.day) || { visitors: new Set(), pageViews: 0 }
    day.visitors.add(visitorKey)
    day.pageViews += row.views
    daily.set(row.day, day)
  }

  console.log(JSON.stringify({
    period: { days, since: sinceDay },
    uniqueVisitors: visitors.size,
    pageViews,
    daily: [...daily].map(([day, value]) => ({
      day,
      uniqueVisitors: value.visitors.size,
      pageViews: value.pageViews,
    })),
    topPages: [...pageViewsByPath]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, views]) => ({ path, views })),
  }, null, 2))
} finally {
  await prisma.$disconnect()
}
