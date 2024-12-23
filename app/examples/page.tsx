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
import { Skeleton } from "../components/ui/skeleton";
import { BlurFade } from "../components/ui/blur-fade";

export default function Examples() {
  const [selected, setSelected] = useState<string>("");
  const [buttonPressed, setButtonPressed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const makeLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleReloadAndRedirect = () => {
    window.location.reload();

    setTimeout(() => {
      window.location.href = "/examples#blur-fade";
    }, 100);
  };

  return (
    <div className="pt-6">
      <TitleHeader
        text="Components Documentation"
        color="black"
        textClassName="font-bold"
      />

      <div className="md:fixed top-0 left-0 bg-slate-200 md:py-12 md:pl-6 md:pr-12 py-5 px-5 md:rounded-r-xl rounded-xl md:min-h-screen mt-5 mb-3 mx-5 md:my-0 md:mx-0">
        <div className="text-black-main md:pb-5 pb-3 font-bold">
          Table of Content
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <a href="#accordion">Accordion</a>
          <a href="#button">Button</a>
          <a href="#card">Card</a>
          <a href="#committee-card">Committee Card</a>
          <a href="#guide-card">Guide Card</a>
          <a href="#select">Select</a>
          <a href="#skeleton">Skeleton</a>
          <a href="#title-header">Title Header</a>
        </div>
      </div>

      <div className="flex flex-col gap-20 py-5 md:px-80 px-10">
        <section id="accordion">
          <h3 className="text-2xl font-bold text-blue-main">Accordion</h3>
          <p className="mt-2 text-red-main">
            - Accordion <br />- AccordionItem_1 <br />- AccordionTrigger <br />-
            AccordionContent <br />- AccordionItem_1 <br />- AccordionItem_2{" "}
            <br />- AccordionTrigger <br />- AccordionContent
            <br />- AccordionItem_2
          </p>
          <h4 className="mt-4 text-xl font-semibold">Accordion Details:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>
              <strong>Type:</strong>
              <ul className="ml-6">
                <li>
                  Single: Only one can be open at a time; opening a new one
                  closes the previous. Can be collapsible or not.
                </li>
                <li>Multiple: Allows multiple to be open simultaneously.</li>
              </ul>
            </li>
            <li>
              <strong>Props:</strong>
              <ul className="ml-6">
                <li>
                  value: Gets the opened accordion(s) (string or string[] for
                  multiple).
                </li>
                <li>onValueChange: Setter for opened accordion(s).</li>
                <li>defaultValue: Initial value(s).</li>
                <li>collapsible: Used only for single type.</li>
                <li>type: single or multiple.</li>
              </ul>
            </li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main pt-2 pb-7 px-5 rounded-xl flex items-center justify-center">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger iconSize={12}>
                  What is PINUS?
                </AccordionTrigger>
                <AccordionContent>
                  PINUS is a student-run organization established to support
                  Indonesian students during their academic journey at the
                  National University of Singapore (NUS). This organization
                  fosters a sense of community, providing a home away from tes
                  home for Indonesian students, helping them adapt to life in a
                  foreign country, and facilitating academic and social
                  connections.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger isColor={true} iconSize={20}>
                  How to join PINUS?
                </AccordionTrigger>
                <AccordionContent>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Integer nec odio. Praesent libero. Sed cursus ante dapibus
                  diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.
                  Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed
                  augue semper porta. Mauris massa.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger iconSize={25}>
                  Events organized by PINUS?
                </AccordionTrigger>
                <AccordionContent>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Integer nec odio. Praesent libero. Sed cursus ante dapibus
                  diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.
                  Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed
                  augue semper porta. Mauris massa.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section id="blur-fade">
          <h3 className="text-2xl font-bold text-blue-main">BlurFade</h3>
          <p className="mt-2 text-red-main">
            Make the text on web launch pretty.{" "}
            <a
              href="/guides"
              className="text-blue-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reference
            </a>
          </p>
          <h4 className="mt-4 text-xl font-semibold">Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>duration: Time (in seconds) for the animation.</li>
            <li>delay: Time (in seconds) before the animation starts.</li>
            <li>offset: Animation offset.</li>
            <li>direction: Direction of animation (up, down, left, right).</li>
            <li>inView: Triggers animation when the component is in view.</li>
            <li>inViewMargin: Margin for the in-view trigger.</li>
            <li>blur: Amount of blur applied during the animation.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex flex-col gap-4 items-center justify-center">
            <BlurFade delay={0.5} inView>
              ANJAY
            </BlurFade>
            <Button onClick={handleReloadAndRedirect}>Restart Animation</Button>
          </div>
        </section>

        <section id="button">
          <h3 className="text-2xl font-bold text-blue-main">Button</h3>
          <h4 className="mt-4 text-xl font-semibold">Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>variant: blue, yellow, red, black.</li>
            <li>rounding: none, sm, md, lg, xl, full.</li>
            <li>onClick: Function.</li>
            <li>outline: true or false.</li>
            <li>size: sm, md, lg.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex items-center justify-center">
            <div className="flex flex-col gap-4 w-fit" id="buttons">
              <Button
                variant="blue"
                rounding="xl"
                onClick={() => setButtonPressed(buttonPressed + 1)}
              >
                Press me
              </Button>

              <Button variant="red" className="text-xl" rounding="full" outline>
                Submit
              </Button>

              <div>PRESSED: {buttonPressed}</div>
            </div>
          </div>
        </section>

        <section id="card">
          <h3 className="text-2xl font-bold text-blue-main">Card</h3>
          <h4 className="mt-4 text-xl font-semibold">Card Structure:</h4>
          <p className="mt-2 text-red-main">
            - CardImage <br />- CardHeader <br />- CardTitle <br />-
            CardDescription <br />- CardFooter
            <br />- CardBadge/CardTags
          </p>
          <h4 className="mt-4 text-xl font-semibold">CardImage Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>src: Image source.</li>
            <li>alt: Alt text.</li>
            <li>width/height: Dimensions.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex md:flex-row flex-col items-center justify-center gap-5">
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
                  Annual event for prospective students to know more about
                  studies and life in NUS.{" "}
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
                <CardDescription italic>
                  By Babono on 20 Nov 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Annual event to welcome our matriculated freshies into NUS.
                </p>
              </CardContent>
              <CardFooter>
                <CardTags teamName="WELFARE" eventType="ORIENTATION" />
              </CardFooter>
            </Card>
          </div>
        </section>

        <section id="committee-card">
          <h3 className="text-2xl font-bold text-blue-main">Committee Card</h3>
          <h4 className="mt-4 text-xl font-semibold">
            CommCardGroup Structure:
          </h4>
          <p className="mt-2 text-red-main">
            - CommCard <br />- CommCardImage <br />- CommCardHeader <br />-
            CommCardTitle <br />- CommCardDescription
          </p>
          <h4 className="mt-4 text-xl font-semibold">CommCardGroup Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>columns: 2 or 3.</li>
            <li>gap: Spacing between cards.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex flex-col items-center justify-center">
            <h5 className="pb-4 text-md">Column 3:</h5>
            <div className="flex items-center justify-center mx-auto">
              <CommCardGroup className="w-full" columns={3} gap={8}>
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
                      <CommCardDescription italic>
                        {ppl.role}
                      </CommCardDescription>
                    </CommCardHeader>
                  </CommCard>
                ))}
              </CommCardGroup>
            </div>

            <h5 className="pt-10 pb-4 text-md">Column 2:</h5>
            <div className="flex items-center justify-center mx-auto">
              <CommCardGroup className="w-full" columns={2} gap={4}>
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
                      width={100}
                      height={200}
                      className="w-[184px] h-56"
                    />
                    <CommCardHeader>
                      <CommCardTitle>{ppl.name}</CommCardTitle>
                      <CommCardDescription italic>
                        {ppl.role}
                      </CommCardDescription>
                    </CommCardHeader>
                  </CommCard>
                ))}
              </CommCardGroup>
            </div>
          </div>
        </section>

        <section id="guide-card">
          <h3 className="text-2xl font-bold text-blue-main">Guide Card</h3>
          <h4 className="mt-4 text-xl font-semibold">GuideCard Structure:</h4>
          <p className="mt-2 text-red-main">
            - GuideCard <br />- GuideCardDecoration <br />- GuideCardBody <br />
            - GuideCardTitle <br />- GuideCardText
          </p>
          <h4 className="mt-4 text-xl font-semibold">
            GuideCardDecoration Props:
          </h4>
          <ul className="mt-2 list-disc list-inside">
            <li>color: blue, yellow, red, black.</li>
            <li>size: Number.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex items-center justify-center">
            <GuideCard className="w-96">
              <GuideCardDecoration color="red" width={3} height={60} />
              <GuideCardBody>
                <GuideCardTitle>Apply for NUS Housing 🏠</GuideCardTitle>
                <GuideCardText>
                  <div>
                    <h6 className="font-semibold">Halls of Residence</h6>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </p>
                  </div>
                  <div>
                    <h6 className="font-semibold">House</h6>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </p>
                  </div>
                </GuideCardText>
              </GuideCardBody>
            </GuideCard>
          </div>
        </section>

        <section id="select">
          <h3 className="text-2xl font-bold text-blue-main">Select</h3>
          <h4 className="mt-4 text-xl font-semibold">Select Structure:</h4>
          <p className="mt-2">
            - Select
            <br />- SelectTrigger <br />- SelectValue <br />- SelectContent{" "}
            <br />- SelectGroup <br />- SelectLabel <br />- SelectItem
          </p>
          <h4 className="mt-4 text-xl font-semibold">Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>value: Gets the selected value.</li>
            <li>onValueChange: Setter for selection.</li>
            <li>defaultValue: Initial value.</li>
            <li>defaultOpen: Boolean for default open state.</li>
            <li>open: Controlled open state.</li>
            <li>onOpenChange: Event handler for open state changes.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex md:flex-row flex-col gap-5 items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-1">
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
              <div>SELECTED VALUE: {selected}</div>
            </div>

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
          </div>
        </section>

        <section id="skeleton">
          <h3 className="text-2xl font-bold text-blue-main">Skeleton</h3>
          <p className="mt-2">
            Make the loading state look nicer, act as a placeholder whilst
            fetching data.
          </p>
          <h4 className="mt-4 text-xl font-semibold">Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>
              skeletonColor: Options are blue, yellow, red, black, or muted.
            </li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex items-center justify-center">
            <div className="flex flex-col space-y-3">
              <Skeleton
                className="h-[125px] w-[250px] rounded-xl"
                skeletonColor="blue"
              />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" skeletonColor="black" />
                <Skeleton className="h-4 w-[200px]" skeletonColor="red" />
              </div>
            </div>
          </div>

          <h5 className="pt-5 pb-2 font-semibold text-xl">
            Example Implementation:
          </h5>
          <div
            className="mx-auto bg-white-main w-full py-5 px-5 rounded-xl space-y-4"
            id="loading"
          >
            <Button
              variant="blue"
              rounding="full"
              outline
              onClick={makeLoading}
            >
              Make Loading
            </Button>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-4 w-full h-full">
              {isLoading
                ? [...Array(2)].map((_, index) => (
                    <Skeleton
                      key={index}
                      className="w-full h-[155px]"
                      skeletonColor="muted"
                    />
                  ))
                : [...Array(2)].map((_, index) => (
                    <div key={index}>
                      <Card className="h-full border border-gray-100 rounded-xl">
                        <CardHeader>
                          <CardTitle>Title {index + 1}</CardTitle>
                          <CardDescription>Description</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>{index + 1}</p>
                        </CardContent>
                        <CardFooter>
                          <CardTags
                            teamName="WELFARE"
                            eventType="ORIENTATION"
                          />
                        </CardFooter>
                      </Card>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        <section id="title-header">
          <h3 className="text-2xl font-bold text-blue-main">Title Header</h3>
          <p className="mt-2">
            Adds 20px to the text&apos;s total width for an underline
          </p>
          <h4 className="mt-4 text-xl font-semibold">Props:</h4>
          <ul className="mt-2 list-disc list-inside">
            <li>text: The text content.</li>
            <li>color: blue, yellow, red, black. </li>
            <li>textClassName: Custom class for text. </li>
            <li>underlineClassName: Custom class for underline/decoration.</li>
          </ul>
          <h5 className="pt-5 pb-2 font-semibold text-xl">Example:</h5>
          <div className="bg-white-main py-5 px-5 rounded-xl flex flex-col gap-4 items-center justify-center">
            <TitleHeader text="FAQs" color="blue" />
            <TitleHeader text="Our Committee" color="red" />
            <TitleHeader
              text="Hello World"
              color="yellow"
              className="mt-8"
              textClassName="text-3xl"
              underlineClassName="h-2"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
