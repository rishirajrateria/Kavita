import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/heading";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CompositesSection() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Heading as="h2" level={2} id="composites">
          Composites
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Interactive shadcn/ui pieces. These are the only client components on this page.
        </p>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Breadcrumb
        </Heading>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Section</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Tabs
        </Heading>
        <Tabs defaultValue="one" className="max-w-xl">
          <TabsList>
            <TabsTrigger value="one">First</TabsTrigger>
            <TabsTrigger value="two">Second</TabsTrigger>
            <TabsTrigger value="three">Third</TabsTrigger>
          </TabsList>
          <TabsContent value="one" className="text-sm text-muted-foreground">
            First tab sample content.
          </TabsContent>
          <TabsContent value="two" className="text-sm text-muted-foreground">
            Second tab sample content.
          </TabsContent>
          <TabsContent value="three" className="text-sm text-muted-foreground">
            Third tab sample content.
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Accordion (FAQ pattern)
        </Heading>
        <Accordion type="single" collapsible className="max-w-xl">
          <AccordionItem value="a">
            <AccordionTrigger>Sample question one?</AccordionTrigger>
            <AccordionContent>Sample answer text for the first item.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Sample question two?</AccordionTrigger>
            <AccordionContent>Sample answer text for the second item.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Select, Dialog, Sheet
        </Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Select>
            <SelectTrigger className="w-56" aria-label="Sample select">
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one">Option one</SelectItem>
              <SelectItem value="two">Option two</SelectItem>
              <SelectItem value="three">Option three</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="gold">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Sample dialog</DialogTitle>
                <DialogDescription>Sample dialog description text.</DialogDescription>
              </DialogHeader>
              <p className="text-sm">Sample body content.</p>
              <DialogFooter>
                <Button variant="primary">Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="font-serif text-xl">Sample sheet</SheetTitle>
                <SheetDescription>Slides in from the side; used for mobile nav.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Table
        </Heading>
        <Table>
          <TableCaption>Sample comparison table.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Column A</TableHead>
              <TableHead>Column B</TableHead>
              <TableHead className="text-right">Column C</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Row one</TableCell>
              <TableCell>Sample</TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row two</TableCell>
              <TableCell>Sample</TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Pagination
        </Heading>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
