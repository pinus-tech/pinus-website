"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Card,
  CardImage,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardTags,
  CardBadge,
} from "../components/ui/card";
import { TitleHeader } from "../components/ui/title";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  CommCard,
  CommCardGroup,
  CommCardHeader,
  CommCardImage,
  CommCardTitle,
  CommCardDescription,
} from "../components/ui/committee-card";
import {
  GuideCard,
  GuideCardDecoration,
  GuideCardBody,
  GuideCardTitle,
  GuideCardText,
} from "../components/ui/guide-card";

export default function Examples() {
  const [selected, setSelected] = useState<string>("");
  const [buttonPressed, setButtonPressed] = useState<number>(0);

  return (
    <div>
      <TitleHeader text="Frequently Asked Questions" color="blue" />
      <TitleHeader text="Our Committee" color="red" />
      <TitleHeader
        text="Hello World"
        color="blue"
        className="mt-8"
        textClassName="text-3xl"
        underlineClassName="h-2"
      />

      <div className="flex gap-4 p-4">
        <Accordion type="multiple" className="w-96">
          <AccordionItem value="item-1">
            <AccordionTrigger iconSize={12}>What is PINUS?</AccordionTrigger>
            <AccordionContent>
              PINUS is a student-run organization established to support
              Indonesian students during their academic journey at the National
              University of Singapore (NUS). This organization fosters a sense
              of community, providing a home away from tes home for Indonesian
              students, helping them adapt to life in a foreign country, and
              facilitating academic and social connections.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger isColor={true} iconSize={20}>
              How to join PINUS?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.
              Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.
              Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris
              massa.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger iconSize={25}>
              What events organized by PINUS?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.
              Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.
              Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris
              massa.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="h-fit">
          <CardImage
            src="/test_img.jpg"
            alt="random"
            className="rounded-xl h-64"
            width={300}
            height={100}
          />
          <CardHeader>
            <CardTitle>PINUS Open Day</CardTitle>
            <CardDescription>
              Annual event for prospective students to know more about studies
              and life in NUS.{" "}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <CardBadge>Ambassadors</CardBadge>
            <CardBadge>Welfare</CardBadge>
          </CardFooter>
        </Card>

        <Card>
          <CardImage
            src="/test_img.jpg"
            alt="random"
            width={300}
            height={200}
          />
          <CardHeader>
            <CardTitle className="font-bold">Humans of PINUS</CardTitle>
            <CardDescription italic>By Babono on 20 Nov 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Annual event to welcome our matriculated freshies into NUS.</p>
          </CardContent>
          <CardFooter>
            <CardTags teamName="WELFARE" eventType="ORIENTATION" />
          </CardFooter>
        </Card>

        <div className="flex flex-col gap-4 w-fit">
          <Button
            variant="blue"
            rounding="xl"
            className="text-3xl"
            onClick={() => setButtonPressed(buttonPressed + 1)}
          >
            Submit
          </Button>

          <Button variant="blue" rounding="full" outline>
            Submit
          </Button>

          <Button variant="red" rounding="sm" size="sm">
            Small
          </Button>

          <Button variant="yellow" size="lg" outline>
            Large
          </Button>

          <Button variant="black" rounding="md" size="md">
            Medium
          </Button>

          <Button
            variant="yellow"
            size="lg"
            rounding="none"
            className="rounded-full"
            outline
          >
            None
          </Button>

          <div>PRESSED: {buttonPressed}</div>
        </div>

        <div className="flex flex-col gap-4 w-fit">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger
              variant="blue"
              size="md"
              rounding="xl"
              className="w-64 font-bold"
            >
              <SelectValue placeholder="Pilih makanan enak" />
            </SelectTrigger>
            <SelectContent variant="blue" rounding="xl">
              <SelectGroup>
                <SelectLabel>Makanan Indonesia</SelectLabel>
                <SelectItem variant="blue" isColor value="nasi_goreng">
                  Nasi Goreng
                </SelectItem>
                <SelectItem variant="blue" isColor value="sate">
                  Sate
                </SelectItem>
                <SelectItem variant="blue" isColor value="rendang">
                  Rendang
                </SelectItem>
                <SelectItem variant="blue" isColor value="gado_gado">
                  Gado-Gado
                </SelectItem>
                <SelectItem variant="blue" isColor value="bakso">
                  Bakso
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger
              variant="red"
              size="md"
              rounding="lg"
              outline
              className="w-64 font-semibold"
            >
              <SelectValue placeholder="Pilih makanan enak" />
            </SelectTrigger>
            <SelectContent variant="red" outline rounding="lg">
              <SelectGroup className="h-56">
                <SelectLabel>Makanan Indonesia</SelectLabel>
                <SelectItem variant="red" value="nasi_goreng">
                  Nasi Goreng
                </SelectItem>
                <SelectItem variant="red" value="sate">
                  Sate
                </SelectItem>
                <SelectItem variant="red" value="rendang">
                  Rendang
                </SelectItem>
                <SelectItem variant="red" value="gado_gado">
                  Gado-Gado
                </SelectItem>
                <SelectItem variant="red" value="bakso">
                  Bakso
                </SelectItem>
                <SelectItem variant="red" value="mie_ayam">
                  Mie Ayam
                </SelectItem>
                <SelectItem variant="red" value="soto">
                  Soto
                </SelectItem>
                <SelectItem variant="red" value="tahu_goreng">
                  Tahu Goreng
                </SelectItem>
                <SelectItem variant="red" value="tempe_mendoan">
                  Tempe Mendoan
                </SelectItem>
                <SelectItem variant="red" value="pecel_lele">
                  Pecel Lele
                </SelectItem>
                <SelectItem variant="red" value="ikan_bakar">
                  Ikan Bakar
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div>SELECTED VALUE: {selected}</div>
        </div>
      </div>

      <div className="flex items-center justify-center mx-auto py-10">
        <CommCardGroup className="w-[50vw]" columns={3} gap={20}>
          {[
            { name: "Cullen Sean", role: "President" },
            { name: "Hastuti Hera H", role: "Vice President" },
            { name: "Charly Chandra", role: "Financial Secretary" },
            {
              name: "Puspa Tania Zahrani",
              role: "Community Affairs Secretary",
            },
            { name: "Karen Natalie", role: "General Secretary" },
            { name: "Charly Chandra", role: "Financial Secretary" },
            {
              name: "Puspa Tania Zahrani",
              role: "Community Affairs Secretary",
            },
            { name: "Karen Natalie", role: "General Secretary" },
          ].map((ppl, i) => (
            <CommCard key={i}>
              <CommCardImage
                src="/test_img.jpg"
                alt="random"
                width={600}
                height={400}
              />
              <CommCardHeader>
                <CommCardTitle>{ppl.name}</CommCardTitle>
                <CommCardDescription italic>{ppl.role}</CommCardDescription>
              </CommCardHeader>
            </CommCard>
          ))}
        </CommCardGroup>
      </div>

      <div className="flex items-center justify-center mx-auto py-10">
        <CommCardGroup className="w-96 gap-6" columns={2} gap={4}>
          {[
            { name: "Cullen Sean", role: "President" },
            { name: "Hastuti Hera H", role: "Vice President" },
            { name: "Charly Chandra", role: "Financial Secretary" },
            {
              name: "Puspa Tania Zahrani",
              role: "Community Affairs Secretary",
            },
            { name: "Karen Natalie", role: "General Secretary" },
          ].map((ppl, i) => (
            <CommCard key={i}>
              <CommCardImage
                src="/test_img.jpg"
                alt="random"
                width={300}
                height={200}
              />
              <CommCardHeader>
                <CommCardTitle>{ppl.name}</CommCardTitle>
                <CommCardDescription italic>{ppl.role}</CommCardDescription>
              </CommCardHeader>
            </CommCard>
          ))}
        </CommCardGroup>
      </div>

      <div className="flex justify-center mx-auto py-10">
        <GuideCard className="w-[50vw]">
          <GuideCardDecoration color="blue" size={1} />
          <GuideCardBody>
            <GuideCardTitle>Financial Matters 💰</GuideCardTitle>
            <GuideCardText>
              <div>
                <h6 className="font-semibold">Halls of Residence</h6>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
              </div>
              <div>
                <h6 className="font-semibold">House</h6>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
              </div>
            </GuideCardText>
          </GuideCardBody>
        </GuideCard>
      </div>

      <div className="flex justify-center mx-auto py-10">
        <GuideCard className="w-96">
          <GuideCardDecoration color="red" size={1} />
          <GuideCardBody>
            <GuideCardTitle>Apply for NUS Housing 🏠</GuideCardTitle>
            <GuideCardText>
              <div>
                <h6 className="font-semibold">Halls of Residence</h6>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
              </div>
              <div>
                <h6 className="font-semibold">House</h6>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
              </div>
            </GuideCardText>
          </GuideCardBody>
        </GuideCard>
      </div>
    </div>
  );
}
