// This is guides page and should be done by Team Rafa
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { TitleHeader } from "../components/ui/title";

export default function Faq() {
  return (
    <main className="min-h-screen mx-auto px-8 md:px-72 py-10">
      <TitleHeader text="FAQ" color="blue" />
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible>
          <AccordionItem value="item1">
            <AccordionTrigger>What is PINUS?</AccordionTrigger>
            <AccordionContent>
              PINUS is a student-run organization established to support Indonesian students during their academic
              journey at the National University of Singapore (NUS). This organization fosters a sense of community,
              providing a home away from home for Indonesian students, helping them adapt to life in a foreign
              country, and facilitating academic and social connections.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item2">
            <AccordionTrigger>How to join PINUS?</AccordionTrigger>
            <AccordionContent>
              Silahkan tanya Cullen Sean ya hehe
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item3">
            <AccordionTrigger>What events organized by PINUS?</AccordionTrigger>
            <AccordionContent>
              There are many events held by PINUS, you can check the events page for more information.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>  
  );
}